import {
  APIGatewayProxyWebsocketEventV2,
  APIGatewayProxyResultV2,
} from 'aws-lambda'
import {
  DynamoDBClient,
  PutItemCommand,
  DeleteItemCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb'
import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from '@aws-sdk/client-apigatewaymanagementapi'

const dynamo = new DynamoDBClient({ region: process.env.AWS_REGION })
const TABLE_NAME = process.env.TABLE_NAME!

export const handler = async (event: any): Promise<APIGatewayProxyResultV2> => {
  const { connectionId, routeKey, domainName, stage } =
    event.requestContext as any

  console.log('Event:', JSON.stringify(event, null, 2))

  try {
    // $connect
    if (routeKey === '$connect') {
      const role =
        event.queryStringParameters?.role === 'desktop' ? 'desktop' : 'mobile'
      const roomId = event.queryStringParameters?.roomId ?? 'default'

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

      console.log(`✅ Connected: ${connectionId} as ${role} in room ${roomId}`)
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

      console.log(`❌ Disconnected: ${connectionId}`)
      return { statusCode: 200, body: 'Disconnected' }
    }

    // gyro
    if (routeKey === 'gyro') {
      const body = JSON.parse(event.body ?? '{}')
      const { roomId, alpha, beta, gamma } = body

      if (!roomId) {
        return { statusCode: 400, body: 'Missing roomId' }
      }

      // Busca todos os desktops do mesmo roomId
      const result = await dynamo.send(
        new ScanCommand({
          TableName: TABLE_NAME,
          FilterExpression: '#role = :desktop AND roomId = :roomId',
          ExpressionAttributeNames: { '#role': 'role' },
          ExpressionAttributeValues: {
            ':desktop': { S: 'desktop' },
            ':roomId': { S: roomId },
          },
        }),
      )

      const apigw = new ApiGatewayManagementApiClient({
        endpoint: `https://${domainName}/${stage}`,
      })

      const payload = JSON.stringify({ alpha, beta, gamma })

      // Envia para cada desktop conectado nessa sala
      const sends = (result.Items ?? []).map((item) =>
        apigw
          .send(
            new PostToConnectionCommand({
              ConnectionId: item.connectionId.S!,
              Data: Buffer.from(payload),
            }),
          )
          .catch((err) => {
            // Conexão morta, ignora
            console.warn(
              `Stale connection: ${item.connectionId.S}`,
              err.message,
            )
          }),
      )

      await Promise.all(sends)

      return { statusCode: 200, body: 'Gyro data sent' }
    }

    return { statusCode: 400, body: 'Unknown route' }
  } catch (err) {
    console.error('Error:', err)
    return { statusCode: 500, body: 'Internal error' }
  }
}
