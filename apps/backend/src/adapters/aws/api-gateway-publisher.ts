import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from '@aws-sdk/client-apigatewaymanagementapi'
import type { ServerMessage } from '@fer-oshiro/realtime-contract'
import { serverMessageSchema } from '@fer-oshiro/realtime-contract'

import type { MessagePublisher } from '../../ports/message-publisher'

interface ApiGatewayClient {
  send(command: PostToConnectionCommand): Promise<unknown>
}

const isStaleConnectionError = (error: unknown) => {
  if (!error || typeof error !== 'object') return false

  const candidate = error as {
    name?: unknown
    $metadata?: { httpStatusCode?: unknown }
  }

  return (
    candidate.name === 'GoneException' ||
    candidate.$metadata?.httpStatusCode === 410
  )
}

export class ApiGatewayMessagePublisher implements MessagePublisher {
  private readonly client: ApiGatewayClient

  constructor(domain: string, stage: string, client?: ApiGatewayClient) {
    this.client =
      client ??
      new ApiGatewayManagementApiClient({
        endpoint: `https://${domain}/${stage}`,
      })
  }

  async send(connectionId: string, message: ServerMessage): Promise<void> {
    const payload = serverMessageSchema.parse(message)

    try {
      await this.client.send(
        new PostToConnectionCommand({
          ConnectionId: connectionId,
          Data: Buffer.from(JSON.stringify(payload)),
        }),
      )
    } catch (error) {
      if (!isStaleConnectionError(error)) throw error

      const detail = error instanceof Error ? error.message : String(error)
      console.warn(`Stale connection: ${connectionId}`, detail)
    }
  }
}
