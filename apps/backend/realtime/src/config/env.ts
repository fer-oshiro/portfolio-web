type Environment = NodeJS.ProcessEnv

export interface SignalingEnvironment {
  awsRegion: string
  development: boolean
  tableName: string
  twilioAccountSid: string
  twilioAuthToken: string
}

export interface ChatEnvironment {
  groqApiKey: string
}

export interface DrawingEnvironment {
  awsRegion: string
  drawingsBucket: string
  drawingsPublicBaseUrl: string
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

export const loadSignalingEnvironment = (
  environment: Environment = process.env,
): SignalingEnvironment => ({
  awsRegion: required(environment, 'AWS_REGION'),
  development: environment.NODE_ENV === 'development',
  tableName: required(environment, 'TABLE_NAME'),
  twilioAccountSid: required(environment, 'TWILIO_ACCOUNT_SID'),
  twilioAuthToken: required(environment, 'TWILIO_AUTH_TOKEN'),
})

export const loadChatEnvironment = (
  environment: Environment = process.env,
): ChatEnvironment => ({
  groqApiKey: required(environment, 'GROQ_API_KEY'),
})

export const loadDrawingEnvironment = (
  environment: Environment = process.env,
): DrawingEnvironment => ({
  awsRegion: required(environment, 'AWS_REGION'),
  drawingsBucket: required(environment, 'DRAWINGS_BUCKET'),
  drawingsPublicBaseUrl: required(environment, 'DRAWINGS_PUBLIC_BASE_URL'),
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
