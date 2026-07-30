import {
  serverMessageSchema,
  type ServerMessage,
} from '@fer-oshiro/realtime-contract'
import { WebSocket } from 'ws'

import type { MessagePublisher } from '../../ports/message-publisher'

export class LocalWebSocketMessagePublisher implements MessagePublisher {
  constructor(private readonly clients: ReadonlyMap<string, WebSocket>) {}

  async send(connectionId: string, message: ServerMessage): Promise<void> {
    const payload = JSON.stringify(serverMessageSchema.parse(message))
    const target = this.clients.get(connectionId)
    if (!target || target.readyState !== WebSocket.OPEN) return

    await new Promise<void>((resolve, reject) => {
      target.send(payload, (error) => {
        if (error) reject(error)
        else resolve()
      })
    })
  }
}
