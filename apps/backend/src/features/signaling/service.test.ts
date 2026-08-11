import type { IceServer, ServerMessage } from '@fer-oshiro/realtime-contract'
import assert from 'node:assert/strict'
import test from 'node:test'

import type { MessagePublisher } from '../../ports/message-publisher'
import type { ConnectionRepository, TurnProvider } from './ports'
import { SignalingService } from './service'
import type { Connection } from './types'

class MemoryConnections implements ConnectionRepository {
  readonly connections = new Map<string, Connection>()
  readonly removed: string[] = []

  constructor(initial: Connection[] = []) {
    initial.forEach((connection) => {
      this.connections.set(connection.connectionId, connection)
    })
  }

  async findById(connectionId: string): Promise<Connection | null> {
    return this.connections.get(connectionId) ?? null
  }

  async findByRoom(roomId: string): Promise<Connection[]> {
    return [...this.connections.values()].filter(
      (connection) => connection.roomId === roomId,
    )
  }

  async remove(connectionId: string): Promise<void> {
    this.removed.push(connectionId)
    this.connections.delete(connectionId)
  }

  async save(connection: Connection): Promise<void> {
    this.connections.set(connection.connectionId, connection)
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

class FakeTurnProvider implements TurnProvider {
  calls = 0

  constructor(readonly iceServers: IceServer[]) {}

  async getIceServers(): Promise<IceServer[]> {
    this.calls += 1
    return this.iceServers
  }
}

const storedIceServers: IceServer[] = [
  { urls: 'turn:stored.example.test', username: 'stored' },
]
const generatedIceServers: IceServer[] = [
  { urls: 'turn:generated.example.test', username: 'generated' },
]

test('joins a room by reusing ICE and notifying both sides', async () => {
  const connections = new MemoryConnections([
    {
      connectionId: 'desktop-1',
      iceServers: storedIceServers,
      role: 'desktop',
      roomId: 'room-1',
    },
  ])
  const publisher = new RecordingPublisher()
  const turn = new FakeTurnProvider(generatedIceServers)
  const service = new SignalingService({ connections, publisher, turn })

  await service.join({
    connectionId: 'mobile-1',
    role: 'mobile',
    roomId: 'room-1',
  })

  assert.equal(turn.calls, 0)
  assert.deepEqual(connections.connections.get('mobile-1'), {
    connectionId: 'mobile-1',
    iceServers: storedIceServers,
    role: 'mobile',
    roomId: 'room-1',
  })
  assert.deepEqual(publisher.messages, [
    {
      connectionId: 'mobile-1',
      message: {
        type: 'joined',
        iceServers: storedIceServers,
        peers: [{ connectionId: 'desktop-1', role: 'desktop' }],
      },
    },
    {
      connectionId: 'desktop-1',
      message: {
        type: 'peer_joined',
        peer: { connectionId: 'mobile-1', role: 'mobile' },
      },
    },
  ])
})

test('gets ICE from the provider when joining an empty room', async () => {
  const connections = new MemoryConnections()
  const publisher = new RecordingPublisher()
  const turn = new FakeTurnProvider(generatedIceServers)
  const service = new SignalingService({ connections, publisher, turn })

  await service.join({
    connectionId: 'desktop-1',
    role: 'desktop',
    roomId: 'room-1',
  })

  assert.equal(turn.calls, 1)
  assert.deepEqual(publisher.messages, [
    {
      connectionId: 'desktop-1',
      message: {
        type: 'joined',
        iceServers: generatedIceServers,
        peers: [],
      },
    },
  ])
})

test('relays a signal only when source and target share a room', async () => {
  const connections = new MemoryConnections([
    {
      connectionId: 'desktop-1',
      iceServers: storedIceServers,
      role: 'desktop',
      roomId: 'room-1',
    },
    {
      connectionId: 'mobile-1',
      iceServers: storedIceServers,
      role: 'mobile',
      roomId: 'room-1',
    },
    {
      connectionId: 'mobile-2',
      iceServers: storedIceServers,
      role: 'mobile',
      roomId: 'room-2',
    },
  ])
  const publisher = new RecordingPublisher()
  const service = new SignalingService({
    connections,
    publisher,
    turn: new FakeTurnProvider(generatedIceServers),
  })
  const signal = { type: 'offer' as const, sdp: 'v=0' }

  await service.signal({
    connectionId: 'desktop-1',
    signal,
    targetConnectionId: 'mobile-1',
  })
  await service.signal({
    connectionId: 'desktop-1',
    signal,
    targetConnectionId: 'mobile-2',
  })

  assert.deepEqual(publisher.messages, [
    {
      connectionId: 'mobile-1',
      message: {
        type: 'signal',
        fromConnectionId: 'desktop-1',
        signal,
      },
    },
    {
      connectionId: 'desktop-1',
      message: {
        type: 'error',
        source: 'signaling',
        code: 'INVALID_TARGET',
        message: 'O dispositivo de destino não pertence a esta sala.',
      },
    },
  ])
})

test('disconnect removes the connection', async () => {
  const connections = new MemoryConnections()
  const service = new SignalingService({
    connections,
    publisher: new RecordingPublisher(),
    turn: new FakeTurnProvider(generatedIceServers),
  })

  await service.disconnect('connection-1')

  assert.deepEqual(connections.removed, ['connection-1'])
})
