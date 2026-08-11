import { clientMessageSchema } from '@fer-oshiro/realtime-contract'
import type { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda'
import OpenAI from 'openai'

import { ApiGatewayMessagePublisher } from '../../adapters/aws/api-gateway-publisher'
import { GroqChatProvider } from '../../adapters/aws/groq-chat'
import { loadChatEnvironment } from '../../config/env'
import { ChatService } from '../../features/chat'
import type { MessagePublisher } from '../../ports/message-publisher'

// ---- Clients ----

const environment = loadChatEnvironment()
const groqClient = new OpenAI({
  apiKey: environment.groqApiKey,
  baseURL: 'https://api.groq.com/openai/v1',
})
const chatProvider = new GroqChatProvider(groqClient)

// ---- Route Handlers ----

export const handleChat = async (
  connectionId: string,
  publisher: MessagePublisher,
  body: string,
) => {
  const value: unknown = JSON.parse(body)
  const parsed = clientMessageSchema.safeParse(value)
  if (!parsed.success || parsed.data.action !== 'chat') {
    throw new Error('Invalid chat message')
  }

  const service = new ChatService({ provider: chatProvider, publisher })
  await service.respond({ connectionId, message: parsed.data.message })
}

// ---- Main Handler ----

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
  const { routeKey, connectionId, domainName, stage } = event.requestContext
  const publisher = new ApiGatewayMessagePublisher(domainName, stage)

  try {
    switch (routeKey) {
      case 'chat':
        await handleChat(connectionId, publisher, event.body ?? '{}')
        break

      default:
        return { statusCode: 400, body: 'Route not found' }
    }

    return { statusCode: 200 }
  } catch (err) {
    console.error(`[${routeKey}] error:`, err)

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
