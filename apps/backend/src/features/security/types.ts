export const quotaActions = [
  'chat',
  'get_drawings',
  'join',
  'save_drawing',
  'signal',
  'turn',
] as const

export type QuotaAction = (typeof quotaActions)[number]

export interface SessionContext {
  expiresAt: number
  sessionId: string
}

export interface QuotaLimits {
  globalDaily: Record<QuotaAction | 'total', number>
  session: Record<QuotaAction | 'total', number>
}

export interface CreateSessionInput extends SessionContext {
  maxDailySessions: number
  now: number
  requestId: string
}

export interface ConsumeQuotaInput extends SessionContext {
  action: QuotaAction
  limits: QuotaLimits
  now: number
  requestId: string
}

export interface QuotaRepository {
  consume(input: ConsumeQuotaInput): Promise<void>
  createSession(input: CreateSessionInput): Promise<void>
}

export interface SessionRepository {
  bindConnection(connectionId: string, session: SessionContext): Promise<void>
  findByConnectionId(connectionId: string): Promise<SessionContext | null>
  removeConnection(connectionId: string): Promise<void>
}

export class SessionExpiredError extends Error {
  constructor() {
    super('Session expired')
  }
}

export class QuotaExceededError extends Error {
  constructor() {
    super('Quota exceeded')
  }
}
