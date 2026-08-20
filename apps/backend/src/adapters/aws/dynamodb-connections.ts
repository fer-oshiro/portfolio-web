import {
  DeleteItemCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  QueryCommand,
} from '@aws-sdk/client-dynamodb'
import type { AttributeValue } from '@aws-sdk/client-dynamodb'
import {
  deviceRoleSchema,
  iceServerSchema,
} from '@fer-oshiro/realtime-contract'

import type { Connection, ConnectionRepository } from '../../features/signaling'

type ConnectionItem = Record<string, AttributeValue>

const parseIceServers = (item: ConnectionItem) => {
  const encoded = item.iceServers?.S
  if (!encoded) return null

  try {
    const parsedJson: unknown = JSON.parse(encoded)
    const parsed = iceServerSchema.array().safeParse(parsedJson)
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

const toConnection = (item?: ConnectionItem): Connection | null => {
  const connectionId = item?.connectionId?.S
  const roomId = item?.roomId?.S
  const role = deviceRoleSchema.safeParse(item?.deviceType?.S)
  const iceServers = item ? parseIceServers(item) : null

  if (!connectionId || !roomId || !role.success || !iceServers) return null

  return {
    connectionId,
    iceServers,
    role: role.data,
    roomId,
  }
}

export class DynamoDbConnectionRepository implements ConnectionRepository {
  constructor(
    private readonly tableName: string,
    private readonly client: DynamoDBClient,
    private readonly roomIndexName = 'roomId-index',
  ) {}

  async findById(connectionId: string): Promise<Connection | null> {
    const result = await this.client.send(
      new GetItemCommand({
        TableName: this.tableName,
        Key: { connectionId: { S: connectionId } },
      }),
    )

    return toConnection(result.Item)
  }

  async findByRoom(roomId: string): Promise<Connection[]> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: this.roomIndexName,
        KeyConditionExpression: 'roomId = :roomId',
        ExpressionAttributeValues: {
          ':roomId': { S: roomId },
        },
      }),
    )

    return (result.Items ?? []).flatMap((item) => {
      const connection = toConnection(item)
      return connection ? [connection] : []
    })
  }

  async remove(connectionId: string): Promise<void> {
    await this.client.send(
      new DeleteItemCommand({
        TableName: this.tableName,
        Key: { connectionId: { S: connectionId } },
      }),
    )
  }

  async save(connection: Connection): Promise<void> {
    await this.client.send(
      new PutItemCommand({
        TableName: this.tableName,
        Item: {
          connectionId: { S: connection.connectionId },
          deviceType: { S: connection.role },
          roomId: { S: connection.roomId },
          iceServers: { S: JSON.stringify(connection.iceServers) },
          expiresAt: { N: (Math.floor(Date.now() / 1_000) + 7_200).toString() },
        },
      }),
    )
  }
}
