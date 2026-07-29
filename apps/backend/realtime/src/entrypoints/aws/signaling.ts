import type {
  ClientMessageOf,
  IceServer,
  Peer,
  ServerMessage,
} from '@fer-oshiro/realtime-contract'
import {
  clientMessageSchema,
  iceServerSchema,
  serverMessageSchema,
} from '@fer-oshiro/realtime-contract'
import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from '@aws-sdk/client-apigatewaymanagementapi'
import {
  DeleteItemCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb'
import type { AttributeValue } from '@aws-sdk/client-dynamodb'
import type { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda'

import { IceServers } from './signaling/twilio'

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

const dynamo = new DynamoDBClient(config)
const TABLE_NAME = process.env.TABLE_NAME!

type ConnectionItem = Record<string, AttributeValue>

const sendToConnection = async (
  apigw: ApiGatewayManagementApiClient,
  connectionId: string,
  data: ServerMessage,
) => {
  try {
    await apigw.send(
      new PostToConnectionCommand({
        ConnectionId: connectionId,
        Data: Buffer.from(JSON.stringify(serverMessageSchema.parse(data))),
      }),
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`Stale connection: ${connectionId}`, message)
  }
}

const getPeersInRoom = async (roomId: string, excludeConnectionId: string) => {
  const result = await dynamo.send(
    new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: 'roomId = :roomId AND connectionId <> :self',
      ExpressionAttributeValues: {
        ':roomId': { S: roomId },
        ':self': { S: excludeConnectionId },
      },
    }),
  )
  return result.Items ?? []
}

const getConnection = async (connectionId: string) => {
  const result = await dynamo.send(
    new GetItemCommand({
      TableName: TABLE_NAME,
      Key: { connectionId: { S: connectionId } },
    }),
  )
  return result.Item ?? null
}

const parseIceServers = (item?: ConnectionItem): IceServer[] | null => {
  const encoded = item?.iceServers?.S
  if (!encoded) return null

  try {
    const value: unknown = JSON.parse(encoded)
    const parsed = iceServerSchema.array().safeParse(value)
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

const toPeer = (item: ConnectionItem): Peer | null => {
  const connectionId = item.connectionId?.S
  const role = item.deviceType?.S
  if (!connectionId || (role !== 'desktop' && role !== 'mobile')) return null
  return { connectionId, role }
}

const handleJoin = async (
  apigw: ApiGatewayManagementApiClient,
  connectionId: string,
  message: ClientMessageOf<'join'>,
) => {
  const peers = await getPeersInRoom(message.roomId, connectionId)
  const existingIceServers = peers
    .map((peer) => parseIceServers(peer))
    .find((servers): servers is IceServer[] => Boolean(servers))
  const iceServers =
    existingIceServers ?? iceServerSchema.array().parse(await IceServers())

  await dynamo.send(
    new PutItemCommand({
      TableName: TABLE_NAME,
      Item: {
        connectionId: { S: connectionId },
        deviceType: { S: message.role },
        roomId: { S: message.roomId },
        iceServers: { S: JSON.stringify(iceServers) },
      },
    }),
  )

  await sendToConnection(apigw, connectionId, {
    type: 'joined',
    iceServers,
    peers: peers.flatMap((peer) => {
      const parsed = toPeer(peer)
      return parsed ? [parsed] : []
    }),
  })

  await Promise.all(
    peers.flatMap((peer) => {
      const peerConnectionId = peer.connectionId?.S
      if (!peerConnectionId) return []
      return [
        sendToConnection(apigw, peerConnectionId, {
          type: 'peer_joined',
          peer: { connectionId, role: message.role },
        }),
      ]
    }),
  )
}

const handleSignal = async (
  apigw: ApiGatewayManagementApiClient,
  connectionId: string,
  message: ClientMessageOf<'signal'>,
) => {
  const [source, target] = await Promise.all([
    getConnection(connectionId),
    getConnection(message.targetConnectionId),
  ])

  if (!source || !target || source.roomId?.S !== target.roomId?.S) {
    await sendToConnection(apigw, connectionId, {
      type: 'error',
      source: 'signaling',
      code: 'INVALID_TARGET',
      message: 'O dispositivo de destino não pertence a esta sala.',
    })
    return
  }

  await sendToConnection(apigw, message.targetConnectionId, {
    type: 'signal',
    fromConnectionId: connectionId,
    signal: message.signal,
  })
}

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
  const { connectionId, routeKey, domainName, stage } = event.requestContext
  const apigw = new ApiGatewayManagementApiClient({
    endpoint: `https://${domainName}/${stage}`,
  })

  try {
    if (routeKey === '$connect') {
      return { statusCode: 200, body: 'Connected' }
    }

    if (routeKey === '$disconnect') {
      await dynamo.send(
        new DeleteItemCommand({
          TableName: TABLE_NAME,
          Key: { connectionId: { S: connectionId } },
        }),
      )
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
      await sendToConnection(apigw, connectionId, {
        type: 'error',
        source: 'signaling',
        code: 'INVALID_MESSAGE',
        message: 'Mensagem WebSocket inválida.',
      })
      return { statusCode: 400, body: 'Invalid message' }
    }

    if (parsed.data.action === 'join') {
      await handleJoin(apigw, connectionId, parsed.data)
      return { statusCode: 200, body: 'Joined' }
    }

    if (parsed.data.action === 'signal') {
      await handleSignal(apigw, connectionId, parsed.data)
      return { statusCode: 200, body: 'Signal sent' }
    }

    return { statusCode: 400, body: 'Unknown route' }
  } catch (error) {
    console.error('WebSocket signaling error:', error)
    await sendToConnection(apigw, connectionId, {
      type: 'error',
      source: 'signaling',
      code: 'INTERNAL_ERROR',
      message: 'Erro interno no servidor.',
    })
    return { statusCode: 500, body: 'Internal error' }
  }
}
