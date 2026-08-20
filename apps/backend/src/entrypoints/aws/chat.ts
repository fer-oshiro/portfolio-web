import { clientMessageSchema } from '@fer-oshiro/realtime-contract'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import type { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda'
import OpenAI from 'openai'

import { ApiGatewayMessagePublisher } from '../../adapters/aws/api-gateway-publisher'
import { DynamoDbQuotaRepository } from '../../adapters/aws/dynamodb-quotas'
import { DynamoDbSessionRepository } from '../../adapters/aws/dynamodb-sessions'
import { GroqChatProvider } from '../../adapters/aws/groq-chat'
import { loadChatEnvironment } from '../../config/env'
import { ChatService } from '../../features/chat'
import { SecurityService } from '../../features/security'
import type { MessagePublisher } from '../../ports/message-publisher'
import { resolveSessionContext, respondToSecurityError } from './security'

// ---- Clients ----

const environment = loadChatEnvironment()
const groqClient = new OpenAI({
  apiKey: environment.groqApiKey,
  baseURL: 'https://api.groq.com/openai/v1',
})
const chatProvider = new GroqChatProvider(
  groqClient,
  environment.maxCompletionTokens,
)
const security = new SecurityService(
  new DynamoDbQuotaRepository(
    environment.quotasTableName,
    new DynamoDBClient({ region: environment.awsRegion }),
  ),
  environment.quotaLimits,
)
const sessions = new DynamoDbSessionRepository(
  environment.quotasTableName,
  new DynamoDBClient({ region: environment.awsRegion }),
)

// ---- Route Handlers ----

export const handleChat = async (
  connectionId: string,
  publisher: MessagePublisher,
  message: string,
) => {
  const service = new ChatService({ provider: chatProvider, publisher })
  await service.respond({ connectionId, message })
}

// ---- Main Handler ----

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
  const { routeKey, connectionId, domainName, stage } = event.requestContext
  const publisher = new ApiGatewayMessagePublisher(domainName, stage)

  try {
    switch (routeKey) {
      case 'chat': {
        let value: unknown
        try {
          value = JSON.parse(event.body ?? '{}')
        } catch {
          return { statusCode: 400, body: 'Invalid chat message' }
        }
        const parsed = clientMessageSchema.safeParse(value)
        if (!parsed.success || parsed.data.action !== 'chat') {
          return { statusCode: 400, body: 'Invalid chat message' }
        }

        await security.consume({
          action: 'chat',
          requestId: event.requestContext.requestId,
          session: await resolveSessionContext(event, sessions),
        })
        await handleChat(connectionId, publisher, parsed.data.message)
        break
      }

      default:
        return { statusCode: 400, body: 'Route not found' }
    }

    return { statusCode: 200 }
  } catch (err) {
    console.error(`[${routeKey}] error:`, err)

    const securityResponse = await respondToSecurityError(
      err,
      connectionId,
      publisher,
    )
    if (securityResponse) return securityResponse

    if (routeKey === 'chat') {
      await publisher.send(connectionId, {
        type: 'error',
        source: 'chat',
        code: 'INTERNAL_ERROR',
        message: 'Não foi possível responder agora.',
      })
    }

    return { statusCode: 500 }
  }
}
