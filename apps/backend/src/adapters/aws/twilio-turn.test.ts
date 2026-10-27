import assert from 'node:assert/strict'
import { it } from 'node:test'

import { TwilioTurnProvider } from './twilio-turn'

it('requests TURN credentials and reports their lifetime', async () => {
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
    21_600,
    () => 1_000,
  )

  const credential = await provider.issueCredential()

  assert.deepEqual(calls, [{ ttl: 21_600 }])
  assert.deepEqual(credential, {
    expiresAt: 1_000 + 21_600_000,
    iceServers: [{ urls: 'turn:example.test' }],
    issuedAt: 1_000,
  })
})
