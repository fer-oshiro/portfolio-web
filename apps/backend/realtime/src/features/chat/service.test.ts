import type { ServerMessage } from '@fer-oshiro/realtime-contract'
import assert from 'node:assert/strict'
import test from 'node:test'

import type { MessagePublisher } from '../../ports/message-publisher'
import type { ChatProvider } from './ports'
import { ChatService } from './service'

class FakeChatProvider implements ChatProvider {
  readonly messages: string[] = []

  constructor(private readonly chunks: string[]) {}

  async *stream(message: string): AsyncIterable<string> {
    this.messages.push(message)
    for (const chunk of this.chunks) yield chunk
  }
}

class RecordingPublisher implements MessagePublisher {
  readonly messages: Array<{
    connectionId: string
    message: ServerMessage
  }> = []

  async send(connectionId: string, message: ServerMessage): Promise<void> {
    this.messages.push({ connectionId, message })
  }
}

test('streams buffered chunks and finishes with chat_done', async () => {
  const provider = new FakeChatProvider(['a'.repeat(100), 'b'.repeat(60), 'c'])
  const publisher = new RecordingPublisher()
  const service = new ChatService({ provider, publisher })

  await service.respond({
    connectionId: 'connection-1',
    message: 'Quem é a Fernanda?',
  })

  assert.deepEqual(provider.messages, ['Quem é a Fernanda?'])
  assert.deepEqual(publisher.messages, [
    {
      connectionId: 'connection-1',
      message: {
        type: 'chat_chunk',
        text: `${'a'.repeat(100)}${'b'.repeat(60)}`,
      },
    },
    {
      connectionId: 'connection-1',
      message: { type: 'chat_chunk', text: 'c' },
    },
    {
      connectionId: 'connection-1',
      message: { type: 'chat_done' },
    },
  ])
})

test('finishes an empty provider stream with chat_done', async () => {
  const publisher = new RecordingPublisher()
  const service = new ChatService({
    provider: new FakeChatProvider([]),
    publisher,
  })

  await service.respond({
    connectionId: 'connection-1',
    message: 'Olá',
  })

  assert.deepEqual(publisher.messages, [
    {
      connectionId: 'connection-1',
      message: { type: 'chat_done' },
    },
  ])
})
