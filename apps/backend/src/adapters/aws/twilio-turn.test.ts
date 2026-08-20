import assert from 'node:assert/strict'
import { it } from 'node:test'

import { TwilioTurnProvider } from './twilio-turn'

it('requests TURN credentials with a ten-minute TTL', async () => {
  const calls: unknown[] = []
  const provider = new TwilioTurnProvider(
    {
      tokens: {
        create: async (input) => {
          calls.push(input)
          return { iceServers: [{ urls: 'turn:example.test' }] }
        },
      },
    },
    600,
  )

  await provider.getIceServers()

  assert.deepEqual(calls, [{ ttl: 600 }])
})
