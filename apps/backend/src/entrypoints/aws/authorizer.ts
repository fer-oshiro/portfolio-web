import { createHash } from 'node:crypto'

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import type {
  APIGatewayAuthorizerResult,
  APIGatewayRequestAuthorizerEvent,
} from 'aws-lambda'

import { DynamoDbQuotaRepository } from '../../adapters/aws/dynamodb-quotas'
import { TurnstileVerifier } from '../../adapters/aws/turnstile'
import { loadAuthorizerEnvironment } from '../../config/env'
import {
  QuotaExceededError,
  type QuotaRepository,
} from '../../features/security'

interface AuthorizerDependencies {
  maxDailySessions: number
  now?: () => number
  quotas: QuotaRepository
  sessionTtlSeconds: number
  verifier: Pick<TurnstileVerifier, 'verify'>
}

const policy = (
  event: APIGatewayRequestAuthorizerEvent,
  effect: 'Allow' | 'Deny',
  principalId: string,
  context: Record<string, string | number> = {},
): APIGatewayAuthorizerResult => ({
  principalId,
  policyDocument: {
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'execute-api:Invoke',
        Effect: effect,
        Resource: event.methodArn,
      },
    ],
  },
  context,
})

export const createAuthorizerHandler = ({
  maxDailySessions,
  now = Date.now,
  quotas,
  sessionTtlSeconds,
  verifier,
}: AuthorizerDependencies) => {
  return async (
    event: APIGatewayRequestAuthorizerEvent,
  ): Promise<APIGatewayAuthorizerResult> => {
    const challenge = event.queryStringParameters?.challenge ?? ''
    const remoteIp = event.requestContext.identity?.sourceIp
    const verified = await verifier.verify(challenge, remoteIp)

    if (!verified) {
      console.warn(JSON.stringify({ securityEvent: 'authorizer_denied' }))
      return policy(event, 'Deny', 'anonymous')
    }

    const issuedAt = now()
    const expiresAt = issuedAt + sessionTtlSeconds * 1_000
    const sessionId = createHash('sha256')
      .update(event.requestContext.requestId)
      .digest('hex')
    try {
      await quotas.createSession({
        expiresAt,
        maxDailySessions,
        now: issuedAt,
        requestId: event.requestContext.requestId,
        sessionId,
      })
    } catch (error) {
      if (error instanceof QuotaExceededError) {
        console.warn(
          JSON.stringify({ securityEvent: 'session_quota_rejected' }),
        )
        return policy(event, 'Deny', 'anonymous')
      }
      throw error
    }

    return policy(event, 'Allow', sessionId, { sessionId, expiresAt })
  }
}

let defaultHandler: ReturnType<typeof createAuthorizerHandler> | undefined

export const handler: ReturnType<typeof createAuthorizerHandler> = (event) => {
  if (!defaultHandler) {
    const environment = loadAuthorizerEnvironment()
    const client = new DynamoDBClient({ region: environment.awsRegion })
    defaultHandler = createAuthorizerHandler({
      maxDailySessions: environment.maxDailySessions,
      quotas: new DynamoDbQuotaRepository(environment.quotasTableName, client),
      sessionTtlSeconds: environment.sessionTtlSeconds,
      verifier: new TurnstileVerifier({
        action: environment.turnstileAction,
        hostname: environment.turnstileHostname,
        secretKey: environment.turnstileSecretKey,
      }),
    })
  }

  return defaultHandler(event)
}
