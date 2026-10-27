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
    const others = (await connections.findByRoom(input.roomId)).filter(
      ({ connectionId }) => connectionId !== input.connectionId,
    )
    // A device that reconnects gets a new connectionId while the old one may
    // linger: $disconnect is best effort, and a half-open socket stays alive
    // for API Gateway until the idle timeout. The newest connection of a role
    // wins, so a reconnect never finds the room locked by its own ghost.
    const replaced = others.filter(({ role }) => role === input.role)
    const peers = others.filter(({ role }) => role !== input.role)

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

    await Promise.all(
      replaced.map(({ connectionId }) => connections.remove(connectionId)),
    )
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
