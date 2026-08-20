import {
  DeleteItemCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
} from '@aws-sdk/client-dynamodb'

import type { SessionContext, SessionRepository } from '../../features/security'

const CONNECTION_PREFIX = 'connection#'

export class DynamoDbSessionRepository implements SessionRepository {
  constructor(
    private readonly tableName: string,
    private readonly client: DynamoDBClient,
  ) {}

  async bindConnection(
    connectionId: string,
    session: SessionContext,
  ): Promise<void> {
    await this.client.send(
      new PutItemCommand({
        TableName: this.tableName,
        Item: {
          key: { S: `${CONNECTION_PREFIX}${connectionId}` },
          sessionId: { S: session.sessionId },
          expiresAt: { N: Math.floor(session.expiresAt / 1_000).toString() },
        },
      }),
    )
  }

  async findByConnectionId(
    connectionId: string,
  ): Promise<SessionContext | null> {
    const result = await this.client.send(
      new GetItemCommand({
        TableName: this.tableName,
        Key: { key: { S: `${CONNECTION_PREFIX}${connectionId}` } },
        ConsistentRead: true,
      }),
    )
    const sessionId = result.Item?.sessionId?.S
    const expiresAtSeconds = Number(result.Item?.expiresAt?.N)

    if (!sessionId || !Number.isFinite(expiresAtSeconds)) return null
    return { sessionId, expiresAt: expiresAtSeconds * 1_000 }
  }

  async removeConnection(connectionId: string): Promise<void> {
    await this.client.send(
      new DeleteItemCommand({
        TableName: this.tableName,
        Key: { key: { S: `${CONNECTION_PREFIX}${connectionId}` } },
      }),
    )
  }
}
