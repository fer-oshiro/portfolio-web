import { createHash } from 'node:crypto'

import {
  DynamoDBClient,
  TransactionCanceledException,
  TransactWriteItemsCommand,
} from '@aws-sdk/client-dynamodb'

import {
  QuotaExceededError,
  type ConsumeQuotaInput,
  type CreateSessionInput,
  type QuotaRepository,
} from '../../features/security'

const SESSION_PREFIX = 'session#'
const DAY_PREFIX = 'day#'

const utcDay = (timestamp: number) =>
  new Date(timestamp).toISOString().slice(0, 10)

const idempotencyToken = (requestId: string, action: string) =>
  createHash('sha256')
    .update(`${requestId}:${action}`)
    .digest('hex')
    .slice(0, 36)

export class DynamoDbQuotaRepository implements QuotaRepository {
  constructor(
    private readonly tableName: string,
    private readonly client: DynamoDBClient,
  ) {}

  async createSession(input: CreateSessionInput): Promise<void> {
    const globalExpiresAt = Math.floor(input.now / 1_000) + 3 * 86_400

    try {
      await this.client.send(
        new TransactWriteItemsCommand({
          ClientRequestToken: idempotencyToken(input.requestId, 'session'),
          TransactItems: [
            {
              Put: {
                TableName: this.tableName,
                Item: {
                  key: { S: `${SESSION_PREFIX}${input.sessionId}` },
                  expiresAt: {
                    N: Math.floor(input.expiresAt / 1_000).toString(),
                  },
                  createdAt: { N: input.now.toString() },
                },
                ConditionExpression: 'attribute_not_exists(#key)',
                ExpressionAttributeNames: { '#key': 'key' },
              },
            },
            {
              Update: {
                TableName: this.tableName,
                Key: {
                  key: { S: `${DAY_PREFIX}sessions#${utcDay(input.now)}` },
                },
                UpdateExpression:
                  'SET #expiresAt = if_not_exists(#expiresAt, :expiresAt) ADD #sessions :one',
                ConditionExpression:
                  'attribute_not_exists(#sessions) OR #sessions < :limit',
                ExpressionAttributeNames: {
                  '#expiresAt': 'expiresAt',
                  '#sessions': 'count_sessions',
                },
                ExpressionAttributeValues: {
                  ':expiresAt': { N: globalExpiresAt.toString() },
                  ':limit': { N: input.maxDailySessions.toString() },
                  ':one': { N: '1' },
                },
              },
            },
          ],
        }),
      )
    } catch (error) {
      if (error instanceof TransactionCanceledException) {
        throw new QuotaExceededError()
      }

      throw error
    }
  }

  async consume(input: ConsumeQuotaInput): Promise<void> {
    const actionCounter = `count_${input.action}`
    const globalExpiresAt = Math.floor(input.now / 1_000) + 3 * 86_400

    try {
      await this.client.send(
        new TransactWriteItemsCommand({
          ClientRequestToken: idempotencyToken(input.requestId, input.action),
          TransactItems: [
            {
              Update: {
                TableName: this.tableName,
                Key: {
                  key: { S: `${SESSION_PREFIX}${input.sessionId}` },
                },
                UpdateExpression: 'ADD #total :one, #action :one',
                ConditionExpression:
                  'attribute_exists(#key) AND #expiresAt >= :nowSeconds AND (attribute_not_exists(#total) OR #total < :totalLimit) AND (attribute_not_exists(#action) OR #action < :actionLimit)',
                ExpressionAttributeNames: {
                  '#key': 'key',
                  '#expiresAt': 'expiresAt',
                  '#total': 'count_total',
                  '#action': actionCounter,
                },
                ExpressionAttributeValues: {
                  ':one': { N: '1' },
                  ':nowSeconds': {
                    N: Math.floor(input.now / 1_000).toString(),
                  },
                  ':totalLimit': {
                    N: input.limits.session.total.toString(),
                  },
                  ':actionLimit': {
                    N: input.limits.session[input.action].toString(),
                  },
                },
              },
            },
            {
              Update: {
                TableName: this.tableName,
                Key: { key: { S: `${DAY_PREFIX}${utcDay(input.now)}` } },
                UpdateExpression:
                  'SET #expiresAt = if_not_exists(#expiresAt, :expiresAt) ADD #total :one, #action :one',
                ConditionExpression:
                  '(attribute_not_exists(#total) OR #total < :totalLimit) AND (attribute_not_exists(#action) OR #action < :actionLimit)',
                ExpressionAttributeNames: {
                  '#expiresAt': 'expiresAt',
                  '#total': 'count_total',
                  '#action': actionCounter,
                },
                ExpressionAttributeValues: {
                  ':one': { N: '1' },
                  ':expiresAt': { N: globalExpiresAt.toString() },
                  ':totalLimit': {
                    N: input.limits.globalDaily.total.toString(),
                  },
                  ':actionLimit': {
                    N: input.limits.globalDaily[input.action].toString(),
                  },
                },
              },
            },
          ],
        }),
      )
    } catch (error) {
      if (error instanceof TransactionCanceledException) {
        throw new QuotaExceededError()
      }

      throw error
    }
  }
}
