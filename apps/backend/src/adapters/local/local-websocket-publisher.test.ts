import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { ServerMessage } from '@fer-oshiro/realtime-contract'

import { LocalWebSocketMessagePublisher } from './local-websocket-publisher'

describe('LocalWebSocketMessagePublisher', () => {
  it('allows a valid message for a connection that is already gone', async () => {
    const publisher = new LocalWebSocketMessagePublisher(new Map())

    await publisher.send('missing-connection', {
      type: 'chat_done',
    })
  })

  it('validates outgoing messages even when the connection is gone', async () => {
    const publisher = new LocalWebSocketMessagePublisher(new Map())
    const invalidMessage = {
      type: 'joined',
      iceServers: 'invalid',
      peers: [],
    } as unknown as ServerMessage

    await assert.rejects(() =>
      publisher.send('missing-connection', invalidMessage),
    )
  })
})
