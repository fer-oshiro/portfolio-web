import type { ServerMessage } from '@charmbyte/realtime-contract'
import { serverMessageSchema } from '@charmbyte/realtime-contract'
import type { WebSocket } from 'ws'

import { IWebSocketProvider } from './IWebsocketProvider'

export class WebsocketLocalProvider implements IWebSocketProvider {
  constructor(public clients: Map<string, WebSocket>) {}

  async sendMessage(
    connectionId: string,
    payload: ServerMessage,
  ): Promise<void> {
    const target = this.clients.get(connectionId)
    target?.send(JSON.stringify(serverMessageSchema.parse(payload)))
  }
}
