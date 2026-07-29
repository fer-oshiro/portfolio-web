import type { ServerMessage } from '@fer-oshiro/realtime-contract'

export interface IWebSocketProvider {
  sendMessage(connectionId: string, payload: ServerMessage): Promise<void>
}
