import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { Connection } from '../../features/signaling'
import { MemoryConnectionRepository } from './memory-connections'

const desktop: Connection = {
  connectionId: 'desktop-1',
  iceServers: [{ urls: 'stun:stun.example.test' }],
  role: 'desktop',
  roomId: 'room-1',
}

const mobile: Connection = {
  connectionId: 'mobile-1',
  iceServers: desktop.iceServers,
  role: 'mobile',
  roomId: 'room-1',
}

describe('MemoryConnectionRepository', () => {
  it('stores, queries and removes connections without persistence', async () => {
    const repository = new MemoryConnectionRepository()

    await repository.save(desktop)
    await repository.save(mobile)

    assert.deepEqual(await repository.findById(desktop.connectionId), desktop)
    assert.deepEqual(await repository.findByRoom('room-1'), [desktop, mobile])
    assert.deepEqual(await repository.findByRoom('another-room'), [])

    await repository.remove(desktop.connectionId)

    assert.equal(await repository.findById(desktop.connectionId), null)
    assert.deepEqual(await repository.findByRoom('room-1'), [mobile])
  })

  it('starts empty in every new instance', async () => {
    const first = new MemoryConnectionRepository()
    await first.save(desktop)

    const restarted = new MemoryConnectionRepository()

    assert.equal(await restarted.findById(desktop.connectionId), null)
  })
})
