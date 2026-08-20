import type { Peer } from '@fer-oshiro/realtime-contract'

import type { SignalingDependencies } from './ports'
import type { Connection, JoinInput, SignalInput } from './types'

const toPeer = ({ connectionId, role }: Connection): Peer => ({
  connectionId,
  role,
})

export class SignalingService {
  constructor(private readonly dependencies: SignalingDependencies) {}

  async disconnect(connectionId: string): Promise<void> {
    await this.dependencies.connections.remove(connectionId)
  }

  async join(input: JoinInput): Promise<void> {
    const { connections, publisher, turn } = this.dependencies
    const peers = (await connections.findByRoom(input.roomId)).filter(
      ({ connectionId }) => connectionId !== input.connectionId,
    )
    if (peers.some(({ role }) => role === input.role) || peers.length >= 2) {
      await publisher.send(input.connectionId, {
        type: 'error',
        source: 'signaling',
        code: 'ROOM_FULL',
        message: 'Esta sala já possui um dispositivo com o mesmo papel.',
      })
      return
    }

    if (peers.length === 0 && input.role === 'mobile') {
      await publisher.send(input.connectionId, {
        type: 'error',
        source: 'signaling',
        code: 'ROOM_NOT_READY',
        message: 'A sala ainda não está disponível.',
      })
      return
    }

    if (peers.length === 0) await input.beforeTurn?.()
    const iceServers = peers.at(0)?.iceServers ?? (await turn.getIceServers())

    await connections.save({
      connectionId: input.connectionId,
      iceServers,
      role: input.role,
      roomId: input.roomId,
    })

    await publisher.send(input.connectionId, {
      type: 'joined',
      iceServers,
      peers: peers.map(toPeer),
    })

    await Promise.all(
      peers.map(({ connectionId }) =>
        publisher.send(connectionId, {
          type: 'peer_joined',
          peer: {
            connectionId: input.connectionId,
            role: input.role,
          },
        }),
      ),
    )
  }

  async signal(input: SignalInput): Promise<void> {
    const { connections, publisher } = this.dependencies
    const [source, target] = await Promise.all([
      connections.findById(input.connectionId),
      connections.findById(input.targetConnectionId),
    ])

    if (!source || !target || source.roomId !== target.roomId) {
      await publisher.send(input.connectionId, {
        type: 'error',
        source: 'signaling',
        code: 'INVALID_TARGET',
        message: 'O dispositivo de destino não pertence a esta sala.',
      })
      return
    }

    await publisher.send(input.targetConnectionId, {
      type: 'signal',
      fromConnectionId: input.connectionId,
      signal: input.signal,
    })
  }
}
