import type { ServerMessage } from '@charmbyte/realtime-contract'

export interface IWebSocketProvider {
  sendMessage(connectionId: string, payload: ServerMessage): Promise<void>
}
