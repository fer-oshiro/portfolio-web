import { IWebSocketProvider } from './IWebsocketProvider'

export class WebsocketLocalProvider implements IWebSocketProvider {
  constructor(public clients: any) {}

  async sendMessage(connectionId: string, payload: any): Promise<void> {
    const target = this.clients.get(connectionId)
    target.send(JSON.stringify(payload))
  }
}
