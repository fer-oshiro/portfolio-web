import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from '@aws-sdk/client-apigatewaymanagementapi'
import { IWebSocketProvider } from './IWebsocketProvider'

export class AwsApiGatewayProvider implements IWebSocketProvider {
  private client: ApiGatewayManagementApiClient

  constructor(domain: string, stage: string) {
    this.client = new ApiGatewayManagementApiClient({
      endpoint: `https://${domain}/${stage}`,
    })
  }

  async sendMessage(connectionId: string, payload: any): Promise<void> {
    const command = new PostToConnectionCommand({
      ConnectionId: connectionId,
      Data: JSON.stringify(payload),
    })
    await this.client.send(command)
  }
}
