import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { APIGatewayRequestAuthorizerEvent } from 'aws-lambda'

import {
  QuotaExceededError,
  type CreateSessionInput,
  type QuotaRepository,
} from '../../features/security'
import { createAuthorizerHandler } from './authorizer'

const event = (challenge = 'challenge') =>
  ({
    methodArn: 'arn:aws:execute-api:us-east-1:123:api/prod/$connect',
    queryStringParameters: { challenge },
    requestContext: {
      identity: { sourceIp: '203.0.113.10' },
      requestId: 'request-1',
    },
  }) as unknown as APIGatewayRequestAuthorizerEvent

class RecordingQuotas implements QuotaRepository {
  sessions: CreateSessionInput[] = []

  async consume(): Promise<void> {}

  async createSession(input: CreateSessionInput): Promise<void> {
    this.sessions.push(input)
  }
}

describe('WebSocket authorizer', () => {
  it('creates a bounded session only after Turnstile succeeds', async () => {
    const quotas = new RecordingQuotas()
    const handler = createAuthorizerHandler({
      maxDailySessions: 500,
      now: () => 1_000,
      quotas,
      sessionTtlSeconds: 600,
      verifier: { verify: async () => true },
    })

    const result = await handler(event())

    assert.equal(result.policyDocument.Statement[0]?.Effect, 'Allow')
    assert.equal(result.context?.expiresAt, 601_000)
    assert.equal(quotas.sessions.length, 1)
    assert.equal(quotas.sessions[0]?.expiresAt, 601_000)
    assert.equal(quotas.sessions[0]?.maxDailySessions, 500)
    assert.equal(quotas.sessions[0]?.now, 1_000)
    assert.equal(quotas.sessions[0]?.sessionId, result.principalId)
  })

  it('denies invalid challenges without creating a session', async () => {
    const quotas = new RecordingQuotas()
    const handler = createAuthorizerHandler({
      maxDailySessions: 500,
      quotas,
      sessionTtlSeconds: 600,
      verifier: { verify: async () => false },
    })

    const result = await handler(event('invalid'))

    assert.equal(result.policyDocument.Statement[0]?.Effect, 'Deny')
    assert.equal(quotas.sessions.length, 0)
  })

  it('denies new connections after the global session quota', async () => {
    const handler = createAuthorizerHandler({
      maxDailySessions: 500,
      quotas: {
        consume: async () => undefined,
        createSession: async () => {
          throw new QuotaExceededError()
        },
      },
      sessionTtlSeconds: 600,
      verifier: { verify: async () => true },
    })

    const result = await handler(event())

    assert.equal(result.policyDocument.Statement[0]?.Effect, 'Deny')
  })
})
