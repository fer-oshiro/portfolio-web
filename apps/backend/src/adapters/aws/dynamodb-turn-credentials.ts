import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
} from '@aws-sdk/client-dynamodb'
import { iceServerSchema } from '@fer-oshiro/realtime-contract'

import type {
  TurnCredential,
  TurnCredentialStore,
} from '../../features/signaling'

const SHARED_CREDENTIAL_ID = 'shared'

const parseIceServers = (encoded?: string) => {
  if (!encoded) return null

  try {
    const parsed = iceServerSchema.array().safeParse(JSON.parse(encoded))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

export class DynamoDbTurnCredentialStore implements TurnCredentialStore {
  constructor(
    private readonly tableName: string,
    private readonly client: DynamoDBClient,
  ) {}

  async find(): Promise<TurnCredential | null> {
    const result = await this.client.send(
      new GetItemCommand({
        TableName: this.tableName,
        Key: { id: { S: SHARED_CREDENTIAL_ID } },
        ConsistentRead: true,
      }),
    )
    const iceServers = parseIceServers(result.Item?.iceServers?.S)
    const issuedAt = Number(result.Item?.issuedAt?.N)
    const expiresAt = Number(result.Item?.expiresAtMs?.N)

    if (!iceServers || !Number.isFinite(issuedAt)) return null
    if (!Number.isFinite(expiresAt)) return null
    return { expiresAt, iceServers, issuedAt }
  }

  async save(credential: TurnCredential): Promise<void> {
    await this.client.send(
      new PutItemCommand({
        TableName: this.tableName,
        Item: {
          id: { S: SHARED_CREDENTIAL_ID },
          iceServers: { S: JSON.stringify(credential.iceServers) },
          issuedAt: { N: credential.issuedAt.toString() },
          expiresAtMs: { N: credential.expiresAt.toString() },
          // DynamoDB TTL (seconds) removes it once Twilio rejects it anyway
          expiresAt: {
            N: Math.ceil(credential.expiresAt / 1_000).toString(),
          },
        },
      }),
    )
  }
}
