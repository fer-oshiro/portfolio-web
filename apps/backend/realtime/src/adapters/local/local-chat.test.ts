import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { ChatProvider } from '../../features/chat'
import { LOCAL_CHAT_RESPONSE, LocalChatProvider } from './local-chat'

describe('LocalChatProvider', () => {
  it('responds predictably without secrets', async () => {
    const provider: ChatProvider = new LocalChatProvider()
    const chunks: string[] = []

    for await (const chunk of provider.stream('Quem é a Fernanda?')) {
      chunks.push(chunk)
    }

    assert.deepEqual(chunks, [LOCAL_CHAT_RESPONSE])
  })
})
