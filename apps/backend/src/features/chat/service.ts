import type { ChatDependencies } from './ports'

const CHAT_CHUNK_SIZE = 150

export interface ChatInput {
  connectionId: string
  message: string
}

export class ChatService {
  constructor(private readonly dependencies: ChatDependencies) {}

  async respond(input: ChatInput): Promise<void> {
    const { provider, publisher } = this.dependencies
    let buffer = ''

    for await (const text of provider.stream(input.message)) {
      if (!text) continue

      buffer += text

      if (buffer.length >= CHAT_CHUNK_SIZE) {
        await publisher.send(input.connectionId, {
          type: 'chat_chunk',
          text: buffer,
        })
        buffer = ''
      }
    }

    if (buffer) {
      await publisher.send(input.connectionId, {
        type: 'chat_chunk',
        text: buffer,
      })
    }

    await publisher.send(input.connectionId, { type: 'chat_done' })
  }
}
