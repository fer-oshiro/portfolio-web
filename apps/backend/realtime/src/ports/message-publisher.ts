import type { ServerMessage } from '@fer-oshiro/realtime-contract'

export interface MessagePublisher {
  send(connectionId: string, message: ServerMessage): Promise<void>
}
