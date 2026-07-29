import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from '@aws-sdk/client-apigatewaymanagementapi'
import type { ServerMessage } from '@fer-oshiro/realtime-contract'
import { serverMessageSchema } from '@fer-oshiro/realtime-contract'
import { IWebSocketProvider } from './IWebsocketProvider'

export class AwsApiGatewayProvider implements IWebSocketProvider {
  private client: ApiGatewayManagementApiClient

  constructor(domain: string, stage: string) {
    this.client = new ApiGatewayManagementApiClient({
      endpoint: `https://${domain}/${stage}`,
    })
  }

  async sendMessage(
    connectionId: string,
    payload: ServerMessage,
  ): Promise<void> {
    const command = new PostToConnectionCommand({
      ConnectionId: connectionId,
      Data: JSON.stringify(serverMessageSchema.parse(payload)),
    })
    await this.client.send(command)
  }
}
