import {
  ConditionalCheckFailedException,
  DynamoDBClient,
  PutItemCommand,
} from '@aws-sdk/client-dynamodb'

export class DynamoDbEventDeduplicator {
  constructor(
    private readonly tableName: string,
    private readonly client: DynamoDBClient,
  ) {}

  async claim(id: string, now = Date.now()): Promise<boolean> {
    try {
      await this.client.send(
        new PutItemCommand({
          TableName: this.tableName,
          Item: {
            key: { S: `event#${id}` },
            createdAt: { N: now.toString() },
            expiresAt: {
              N: (Math.floor(now / 1_000) + 7 * 86_400).toString(),
            },
          },
          ConditionExpression: 'attribute_not_exists(#key)',
          ExpressionAttributeNames: { '#key': 'key' },
        }),
      )
      return true
    } catch (error) {
      if (error instanceof ConditionalCheckFailedException) return false
      throw error
    }
  }
}
