import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from '@aws-sdk/client-apigatewaymanagementapi'
import {
  DeleteItemCommand,
  DynamoDBClient,
  PutItemCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb'
import { APIGatewayProxyResultV2 } from 'aws-lambda'

const dynamo = new DynamoDBClient({
  region: process.env.AWS_REGION,
  endpoint: 'http://localhost:8000',
  tls: false,
  credentials: {
    accessKeyId: 'local',
    secretAccessKey: 'local',
  },
})
const TABLE_NAME = process.env.TABLE_NAME!
console.log({ TABLE_NAME })

const sendToConnection = async (
  apigw: ApiGatewayManagementApiClient,
  connectionId: string,
  data: object,
) => {
  await apigw
    .send(
      new PostToConnectionCommand({
        ConnectionId: connectionId,
        Data: Buffer.from(JSON.stringify(data)),
      }),
    )
    .catch((err) =>
      console.warn(
        `Stale connection: ${connectionId}`,
        err.message,
        JSON.stringify(err),
      ),
    )
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

export const handler = async (event: any): Promise<APIGatewayProxyResultV2> => {
  try {
    const { connectionId, routeKey, domainName, stage } =
      event.requestContext as any
    const apigw = new ApiGatewayManagementApiClient({
      endpoint: `https://${domainName}/${stage}`,
    })

    // $connect
    if (routeKey === '$connect') {
      return { statusCode: 200, body: 'Connected' }
    }

    // $disconnect
    if (routeKey === '$disconnect') {
      await dynamo.send(
        new DeleteItemCommand({
          TableName: TABLE_NAME,
          Key: { connectionId: { S: connectionId } },
        }),
      )

      return { statusCode: 200, body: 'Disconnected' }
    }

    const body = JSON.parse(event.body ?? '{}')

    if (routeKey === 'join') {
      const { roomId, role } = body
      await dynamo.send(
        new PutItemCommand({
          TableName: TABLE_NAME,
          Item: {
            connectionId: { S: connectionId },
            role: { S: role },
            roomId: { S: roomId },
          },
        }),
      )
      const peers = await getPeersInRoom(roomId, connectionId)

      await Promise.all(
        peers.map((peer) =>
          sendToConnection(apigw, peer.connectionId.S!, {
            type: 'peer-joined',
            connectionId,
          }),
        ),
      )

      return { statusCode: 200, body: 'Joined' }
    }

    // offer — mobile envia SDP offer pro desktop
    if (routeKey === 'offer') {
      const { sdp, targetConnectionId } = body

      await sendToConnection(apigw, targetConnectionId, {
        type: 'offer',
        sdp,
        from: connectionId,
      })

      return { statusCode: 200, body: 'Offer sent' }
    }

    // answer — desktop responde com SDP answer pro mobile
    if (routeKey === 'answer') {
      const { sdp, targetConnectionId } = body

      await sendToConnection(apigw, targetConnectionId, {
        type: 'answer',
        sdp,
        from: connectionId,
      })

      return { statusCode: 200, body: 'Answer sent' }
    }

    // iceCandidate — troca de candidatos ICE entre os peers
    if (routeKey === 'iceCandidate') {
      const { candidate, targetConnectionId } = body

      await sendToConnection(apigw, targetConnectionId, {
        type: 'ice-candidate',
        candidate,
        from: connectionId,
      })

      return { statusCode: 200, body: 'ICE candidate sent' }
    }

    return { statusCode: 400, body: 'Unknown route' }
  } catch (err) {
    console.error('Error:', err)
    return { statusCode: 500, body: 'Internal error' }
  }
}
