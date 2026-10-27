import { quotaActions, type QuotaLimits } from '../features/security'

type Environment = NodeJS.ProcessEnv

export interface SignalingEnvironment {
  awsRegion: string
  development: boolean
  quotaLimits: QuotaLimits
  quotasTableName: string
  tableName: string
  turnCredentialTtlSeconds: number
  twilioAccountSid: string
  twilioAuthToken: string
}

export interface ChatEnvironment {
  awsRegion: string
  groqApiKey: string
  maxCompletionTokens: number
  quotaLimits: QuotaLimits
  quotasTableName: string
}

export interface DrawingEnvironment {
  awsRegion: string
  drawingsBucket: string
  drawingsPublicBaseUrl: string
  maxUploadBytes: number
  quotaLimits: QuotaLimits
  quotasTableName: string
  uploadExpiresInSeconds: number
}

export interface AuthorizerEnvironment {
  awsRegion: string
  maxDailySessions: number
  quotasTableName: string
  sessionTtlSeconds: number
  turnstileAction: string
  turnstileHostname: string
  turnstileSecretKey: string
}

export interface CostGuardEnvironment {
  awsRegion: string
  idempotencyTableName: string
  notificationTopicArn: string
  twilioParentAccountSid: string
  twilioParentAuthToken: string
  twilioSubaccountAuthToken: string
  twilioSubaccountSid: string
  webhookUrl: string
}

export interface LocalEnvironment {
  groqApiKey?: string
  host: string
  port: number
}

const optional = (environment: Environment, name: string) => {
  const value = environment[name]
  return value?.trim() ? value : undefined
}

const required = (environment: Environment, name: string) => {
  const value = optional(environment, name)
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

const positiveInteger = (
  environment: Environment,
  name: string,
  fallback?: number,
) => {
  const raw = optional(environment, name)
  if (!raw && fallback !== undefined) return fallback

  const value = Number(raw)
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Invalid positive integer environment variable: ${name}`)
  }

  return value
}

export const defaultQuotaLimits: QuotaLimits = {
  session: {
    total: 300,
    chat: 10,
    get_drawings: 30,
    join: 6,
    save_drawing: 3,
    signal: 200,
    turn: 1,
  },
  globalDaily: {
    total: 5_000,
    chat: 100,
    get_drawings: 5_000,
    join: 5_000,
    save_drawing: 20,
    signal: 5_000,
    turn: 10,
  },
}

const quotaLimits = (environment: Environment): QuotaLimits => {
  const encoded = optional(environment, 'SECURITY_QUOTAS_JSON')
  if (!encoded) return defaultQuotaLimits

  let value: unknown
  try {
    value = JSON.parse(encoded)
  } catch {
    throw new Error('Invalid JSON environment variable: SECURITY_QUOTAS_JSON')
  }

  if (!value || typeof value !== 'object') {
    throw new Error('Invalid quota configuration: SECURITY_QUOTAS_JSON')
  }

  const candidate = value as Partial<QuotaLimits>
  for (const scope of ['session', 'globalDaily'] as const) {
    const limits = candidate[scope]
    if (!limits || typeof limits !== 'object') {
      throw new Error(`Missing quota scope: ${scope}`)
    }

    for (const action of ['total', ...quotaActions] as const) {
      const limit = limits[action]
      if (!Number.isInteger(limit) || (limit ?? 0) <= 0) {
        throw new Error(`Invalid quota limit: ${scope}.${action}`)
      }
    }
  }

  return candidate as QuotaLimits
}

export const loadSignalingEnvironment = (
  environment: Environment = process.env,
): SignalingEnvironment => ({
  awsRegion: required(environment, 'AWS_REGION'),
  development: environment.NODE_ENV === 'development',
  quotaLimits: quotaLimits(environment),
  quotasTableName: required(environment, 'QUOTAS_TABLE_NAME'),
  tableName: required(environment, 'TABLE_NAME'),
  turnCredentialTtlSeconds: positiveInteger(
    environment,
    'TURN_CREDENTIAL_TTL_SECONDS',
    600,
  ),
  twilioAccountSid: required(environment, 'TWILIO_ACCOUNT_SID'),
  twilioAuthToken: required(environment, 'TWILIO_AUTH_TOKEN'),
})

export const loadChatEnvironment = (
  environment: Environment = process.env,
): ChatEnvironment => ({
  awsRegion: required(environment, 'AWS_REGION'),
  groqApiKey: required(environment, 'GROQ_API_KEY'),
  maxCompletionTokens: positiveInteger(
    environment,
    'GROQ_MAX_COMPLETION_TOKENS',
    300,
  ),
  quotaLimits: quotaLimits(environment),
  quotasTableName: required(environment, 'QUOTAS_TABLE_NAME'),
})

export const loadDrawingEnvironment = (
  environment: Environment = process.env,
): DrawingEnvironment => ({
  awsRegion: required(environment, 'AWS_REGION'),
  drawingsBucket: required(environment, 'DRAWINGS_BUCKET'),
  drawingsPublicBaseUrl: required(environment, 'DRAWINGS_PUBLIC_BASE_URL'),
  maxUploadBytes: positiveInteger(environment, 'MAX_UPLOAD_BYTES', 1_000_000),
  quotaLimits: quotaLimits(environment),
  quotasTableName: required(environment, 'QUOTAS_TABLE_NAME'),
  uploadExpiresInSeconds: positiveInteger(
    environment,
    'UPLOAD_EXPIRES_IN_SECONDS',
    300,
  ),
})

export const loadAuthorizerEnvironment = (
  environment: Environment = process.env,
): AuthorizerEnvironment => ({
  awsRegion: required(environment, 'AWS_REGION'),
  maxDailySessions: positiveInteger(environment, 'MAX_DAILY_SESSIONS', 500),
  quotasTableName: required(environment, 'QUOTAS_TABLE_NAME'),
  sessionTtlSeconds: positiveInteger(environment, 'SESSION_TTL_SECONDS', 7_200),
  turnstileAction: required(environment, 'TURNSTILE_ACTION'),
  turnstileHostname: required(environment, 'TURNSTILE_HOSTNAME'),
  turnstileSecretKey: required(environment, 'TURNSTILE_SECRET_KEY'),
})

export const loadCostGuardEnvironment = (
  environment: Environment = process.env,
): CostGuardEnvironment => ({
  awsRegion: required(environment, 'AWS_REGION'),
  idempotencyTableName: required(environment, 'QUOTAS_TABLE_NAME'),
  notificationTopicArn: required(environment, 'NOTIFICATION_TOPIC_ARN'),
  twilioParentAccountSid: required(environment, 'TWILIO_PARENT_ACCOUNT_SID'),
  twilioParentAuthToken: required(environment, 'TWILIO_PARENT_AUTH_TOKEN'),
  twilioSubaccountAuthToken: required(
    environment,
    'TWILIO_SUBACCOUNT_AUTH_TOKEN',
  ),
  twilioSubaccountSid: required(environment, 'TWILIO_SUBACCOUNT_SID'),
  webhookUrl: required(environment, 'TWILIO_WEBHOOK_URL'),
})

export const loadLocalEnvironment = (
  environment: Environment = process.env,
): LocalEnvironment => {
  const parsedPort = Number.parseInt(environment.PORT ?? '8080', 10)

  return {
    groqApiKey: optional(environment, 'GROQ_API_KEY'),
    host: optional(environment, 'REALTIME_HOST') ?? '0.0.0.0',
    port: Number.isNaN(parsedPort) ? 8080 : parsedPort,
  }
}
