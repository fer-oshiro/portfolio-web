import type { APIGatewayProxyWebsocketEventV2 } from 'aws-lambda'

import {
  QuotaExceededError,
  SessionExpiredError,
  type SessionContext,
  type SessionRepository,
} from '../../features/security'
import type { MessagePublisher } from '../../ports/message-publisher'

export const getAuthorizerSessionContext = (
  event: APIGatewayProxyWebsocketEventV2,
): SessionContext => {
  const rawAuthorizer = (
    event.requestContext as unknown as {
      authorizer?: Record<string, unknown>
    }
  ).authorizer as Record<string, unknown> | undefined
  const authorizer =
    rawAuthorizer?.lambda && typeof rawAuthorizer.lambda === 'object'
      ? (rawAuthorizer.lambda as Record<string, unknown>)
      : rawAuthorizer
  const sessionId = authorizer?.sessionId
  const expiresAt = Number(authorizer?.expiresAt)

  if (
    typeof sessionId !== 'string' ||
    !sessionId ||
    !Number.isFinite(expiresAt)
  ) {
    throw new SessionExpiredError()
  }

  return { sessionId, expiresAt }
}

export const resolveSessionContext = async (
  event: APIGatewayProxyWebsocketEventV2,
  sessions: SessionRepository,
): Promise<SessionContext> => {
  const session = await sessions.findByConnectionId(
    event.requestContext.connectionId,
  )
  if (!session) throw new SessionExpiredError()
  return session
}

export const respondToSecurityError = async (
  error: unknown,
  connectionId: string,
  publisher: MessagePublisher,
) => {
  if (error instanceof SessionExpiredError) {
    console.warn(JSON.stringify({ securityEvent: 'session_expired' }))
    await publisher.send(connectionId, {
      type: 'error',
      source: 'security',
      code: 'SESSION_EXPIRED',
      message: 'A sessão expirou. Reconecte para continuar.',
    })
    return { statusCode: 401, body: 'Session expired' }
  }

  if (error instanceof QuotaExceededError) {
    console.warn(JSON.stringify({ securityEvent: 'quota_rejected' }))
    await publisher.send(connectionId, {
      type: 'error',
      source: 'security',
      code: 'QUOTA_EXCEEDED',
      message:
        'O limite de uso público foi atingido. Tente novamente mais tarde.',
    })
    return { statusCode: 429, body: 'Quota exceeded' }
  }

  return null
}
