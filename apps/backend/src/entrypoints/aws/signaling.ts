import { clientMessageSchema } from '@fer-oshiro/realtime-contract'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import type { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda'
import twilio from 'twilio'

import { ApiGatewayMessagePublisher } from '../../adapters/aws/api-gateway-publisher'
import { DynamoDbConnectionRepository } from '../../adapters/aws/dynamodb-connections'
import { DynamoDbQuotaRepository } from '../../adapters/aws/dynamodb-quotas'
import { DynamoDbSessionRepository } from '../../adapters/aws/dynamodb-sessions'
import { TwilioTurnProvider } from '../../adapters/aws/twilio-turn'
import { loadSignalingEnvironment } from '../../config/env'
import { SignalingService } from '../../features/signaling'
import { SecurityService } from '../../features/security'
import {
  getAuthorizerSessionContext,
  resolveSessionContext,
  respondToSecurityError,
} from './security'

const environment = loadSignalingEnvironment()
const dynamoConfig = environment.development
  ? {
      region: environment.awsRegion,
      endpoint: 'http://localhost:8000',
      tls: false,
      credentials: {
        accessKeyId: 'local',
        secretAccessKey: 'local',
      },
    }
  : {
      region: environment.awsRegion,
    }

const connections = new DynamoDbConnectionRepository(
  environment.tableName,
  new DynamoDBClient(dynamoConfig),
)
const sessions = new DynamoDbSessionRepository(
  environment.quotasTableName,
  new DynamoDBClient(dynamoConfig),
)
const turn = new TwilioTurnProvider(
  twilio(environment.twilioAccountSid, environment.twilioAuthToken),
  environment.turnCredentialTtlSeconds,
)
const security = new SecurityService(
  new DynamoDbQuotaRepository(
    environment.quotasTableName,
    new DynamoDBClient(dynamoConfig),
  ),
  environment.quotaLimits,
)

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
  const { connectionId, routeKey, domainName, stage } = event.requestContext
  const publisher = new ApiGatewayMessagePublisher(domainName, stage)
  const signaling = new SignalingService({ connections, publisher, turn })

  try {
    if (routeKey === '$connect') {
      await sessions.bindConnection(
        connectionId,
        getAuthorizerSessionContext(event),
      )
      return { statusCode: 200, body: 'Connected' }
    }

    if (routeKey === '$disconnect') {
      await Promise.all([
        signaling.disconnect(connectionId),
        sessions.removeConnection(connectionId),
      ])
      return { statusCode: 200, body: 'Disconnected' }
    }

    let value: unknown
    try {
      value = JSON.parse(event.body ?? '{}')
    } catch {
      value = null
    }
    const parsed = clientMessageSchema.safeParse(value)
    if (!parsed.success || parsed.data.action !== routeKey) {
      await publisher.send(connectionId, {
        type: 'error',
        source: 'signaling',
        code: 'INVALID_MESSAGE',
        message: 'Mensagem WebSocket inválida.',
      })
      return { statusCode: 400, body: 'Invalid message' }
    }

    if (parsed.data.action === 'join') {
      const session = await resolveSessionContext(event, sessions)
      await security.consume({
        action: 'join',
        requestId: event.requestContext.requestId,
        session,
      })
      await signaling.join({
        beforeTurn: () =>
          security.consume({
            action: 'turn',
            requestId: event.requestContext.requestId,
            session,
          }),
        connectionId,
        role: parsed.data.role,
        roomId: parsed.data.roomId,
      })
      return { statusCode: 200, body: 'Joined' }
    }

    if (parsed.data.action === 'signal') {
      await security.consume({
        action: 'signal',
        requestId: event.requestContext.requestId,
        session: await resolveSessionContext(event, sessions),
      })
      await signaling.signal({
        connectionId,
        signal: parsed.data.signal,
        targetConnectionId: parsed.data.targetConnectionId,
      })
      return { statusCode: 200, body: 'Signal sent' }
    }

    return { statusCode: 400, body: 'Unknown route' }
  } catch (error) {
    console.error('WebSocket signaling error:', error)

    const securityResponse = await respondToSecurityError(
      error,
      connectionId,
      publisher,
    )
    if (securityResponse) return securityResponse

    await publisher.send(connectionId, {
      type: 'error',
      source: 'signaling',
      code: 'INTERNAL_ERROR',
      message: 'Erro interno no servidor.',
    })
    return { statusCode: 500, body: 'Internal error' }
  }
}
