import { clientMessageSchema } from '@fer-oshiro/realtime-contract'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import type { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda'
import twilio from 'twilio'

import { ApiGatewayMessagePublisher } from '../../adapters/aws/api-gateway-publisher'
import { DynamoDbConnectionRepository } from '../../adapters/aws/dynamodb-connections'
import { TwilioTurnProvider } from '../../adapters/aws/twilio-turn'
import { SignalingService } from '../../features/signaling'

const config =
  process.env.NODE_ENV === 'development'
    ? {
        region: process.env.AWS_REGION,
        endpoint: 'http://localhost:8000',
        tls: false,
        credentials: {
          accessKeyId: 'local',
          secretAccessKey: 'local',
        },
      }
    : {
        region: process.env.AWS_REGION,
      }

const connections = new DynamoDbConnectionRepository(
  process.env.TABLE_NAME!,
  new DynamoDBClient(config),
)
const turn = new TwilioTurnProvider(
  twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN),
)

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
  const { connectionId, routeKey, domainName, stage } = event.requestContext
  const publisher = new ApiGatewayMessagePublisher(domainName, stage)
  const signaling = new SignalingService({ connections, publisher, turn })

  try {
    if (routeKey === '$connect') {
      return { statusCode: 200, body: 'Connected' }
    }

    if (routeKey === '$disconnect') {
      await signaling.disconnect(connectionId)
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
      await signaling.join({
        connectionId,
        role: parsed.data.role,
        roomId: parsed.data.roomId,
      })
      return { statusCode: 200, body: 'Joined' }
    }

    if (parsed.data.action === 'signal') {
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
    await publisher.send(connectionId, {
      type: 'error',
      source: 'signaling',
      code: 'INTERNAL_ERROR',
      message: 'Erro interno no servidor.',
    })
    return { statusCode: 500, body: 'Internal error' }
  }
}
