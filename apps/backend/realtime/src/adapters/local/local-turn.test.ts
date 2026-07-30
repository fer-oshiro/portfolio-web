import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { TurnProvider } from '../../features/signaling'
import { DEFAULT_LOCAL_ICE_SERVERS, LocalTurnProvider } from './local-turn'

describe('LocalTurnProvider', () => {
  it('uses STUN without requiring a remote provider', async () => {
    const provider = new LocalTurnProvider()

    assert.deepEqual(await provider.getIceServers(), DEFAULT_LOCAL_ICE_SERVERS)
  })

  it('uses ICE servers from an optional remote provider', async () => {
    const remoteIceServers = [
      {
        urls: 'turn:turn.example.test',
        username: 'local',
        credential: 'secret',
      },
    ]
    const primary: TurnProvider = {
      getIceServers: async () => remoteIceServers,
    }
    const provider = new LocalTurnProvider(primary)

    assert.deepEqual(await provider.getIceServers(), remoteIceServers)
  })

  it('falls back to STUN when the remote provider fails', async () => {
    const primary: TurnProvider = {
      getIceServers: async () => {
        throw new Error('credentials unavailable')
      },
    }
    const provider = new LocalTurnProvider(primary)

    assert.deepEqual(await provider.getIceServers(), DEFAULT_LOCAL_ICE_SERVERS)
  })
})
