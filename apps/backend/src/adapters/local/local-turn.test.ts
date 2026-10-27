import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { TurnProvider } from '../../features/signaling'
import { DEFAULT_LOCAL_ICE_SERVERS, LocalTurnProvider } from './local-turn'

const now = () => 1_000

describe('LocalTurnProvider', () => {
  it('uses STUN without requiring a remote provider', async () => {
    const provider = new LocalTurnProvider(undefined, undefined, now)

    assert.deepEqual(await provider.issueCredential(), {
      expiresAt: 1_000 + 86_400_000,
      iceServers: DEFAULT_LOCAL_ICE_SERVERS,
      issuedAt: 1_000,
    })
  })

  it('uses the credential from an optional remote provider', async () => {
    const remoteCredential = {
      expiresAt: 2_000,
      iceServers: [
        {
          urls: 'turn:turn.example.test',
          username: 'local',
          credential: 'secret',
        },
      ],
      issuedAt: 1_000,
    }
    const primary: TurnProvider = {
      issueCredential: async () => remoteCredential,
    }
    const provider = new LocalTurnProvider(primary)

    assert.deepEqual(await provider.issueCredential(), remoteCredential)
  })

  it('falls back to STUN when the remote provider fails', async () => {
    const primary: TurnProvider = {
      issueCredential: async () => {
        throw new Error('credentials unavailable')
      },
    }
    const provider = new LocalTurnProvider(primary, undefined, now)

    assert.deepEqual(
      (await provider.issueCredential()).iceServers,
      DEFAULT_LOCAL_ICE_SERVERS,
    )
  })
})
