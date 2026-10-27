import assert from 'node:assert/strict'
import type { AddressInfo } from 'node:net'
import { afterEach, describe, it } from 'node:test'

import {
  serverMessageSchema,
  type ServerMessage,
} from '@fer-oshiro/realtime-contract'
import { WebSocket } from 'ws'

import { LocalTurnProvider } from '../../adapters/local/local-turn'
import { MemoryTurnCredentialStore } from '../../adapters/local/memory-turn-credentials'
import { LocalWebSocketMessagePublisher } from '../../adapters/local/local-websocket-publisher'
import { MemoryConnectionRepository } from '../../adapters/local/memory-connections'
import { SignalingService } from '../../features/signaling'
import { createLocalServer, type LocalServer } from '../local'
import { LocalMessageDispatcher } from './dispatcher'

const servers: LocalServer[] = []
const sockets: WebSocket[] = []

afterEach(async () => {
  await Promise.all(
    sockets.splice(0).map(
      (socket) =>
        new Promise<void>((resolve) => {
          if (socket.readyState === WebSocket.CLOSED) {
            resolve()
            return
          }

          socket.once('close', resolve)
          socket.close()
        }),
    ),
  )
  await Promise.all(servers.splice(0).map((server) => server.close()))
})

const connect = async (url: string) => {
  const socket = new WebSocket(url)
  const messages: ServerMessage[] = []
  sockets.push(socket)
  socket.on('message', (data) => {
    const value: unknown = JSON.parse(data.toString())
    messages.push(serverMessageSchema.parse(value))
  })

  await new Promise<void>((resolve, reject) => {
    socket.once('open', resolve)
    socket.once('error', reject)
  })

  return { messages, socket }
}

const takeMessage = async (
  messages: ServerMessage[],
  predicate: (message: ServerMessage) => boolean,
) => {
  const deadline = Date.now() + 2_000

  while (Date.now() < deadline) {
    const index = messages.findIndex(predicate)
    if (index >= 0) return messages.splice(index, 1)[0]!
    await new Promise((resolve) => setTimeout(resolve, 5))
  }

  throw new Error('Timed out waiting for a WebSocket message')
}

const waitUntil = async (predicate: () => boolean | Promise<boolean>) => {
  const deadline = Date.now() + 2_000

  while (Date.now() < deadline) {
    if (await predicate()) return
    await new Promise((resolve) => setTimeout(resolve, 5))
  }

  throw new Error('Timed out waiting for local signaling state')
}

describe('local signaling', () => {
  it('joins two peers and relays offer, answer and ICE candidate', async () => {
    const clients = new Map<string, WebSocket>()
    const connections = new MemoryConnectionRepository()
    const publisher = new LocalWebSocketMessagePublisher(clients)
    const signaling = new SignalingService({
      connections,
      publisher,
      turn: new LocalTurnProvider(),
      turnCredentials: new MemoryTurnCredentialStore(),
    })
    const dispatcher = new LocalMessageDispatcher({
      chat: { respond: async () => undefined },
      drawing: {
        createUpload: async () => undefined,
        list: async () => undefined,
      },
      publisher,
      signaling,
    })
    const server = createLocalServer({
      clients,
      dispatcher,
      host: '127.0.0.1',
      port: 0,
    })
    servers.push(server)
    await server.start()

    const { port } = server.httpServer.address() as AddressInfo
    const url = `ws://127.0.0.1:${port}`
    const desktop = await connect(url)
    desktop.socket.send(
      JSON.stringify({
        action: 'join',
        role: 'desktop',
        roomId: 'room-1',
      }),
    )
    const desktopJoined = await takeMessage(
      desktop.messages,
      (message) => message.type === 'joined',
    )
    assert.deepEqual(desktopJoined, {
      type: 'joined',
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      peers: [],
    })

    const mobile = await connect(url)
    mobile.socket.send(
      JSON.stringify({
        action: 'join',
        role: 'mobile',
        roomId: 'room-1',
      }),
    )
    const mobileJoined = await takeMessage(
      mobile.messages,
      (message) => message.type === 'joined',
    )
    assert.equal(mobileJoined.type, 'joined')
    assert.equal(mobileJoined.peers.length, 1)
    const desktopConnectionId = mobileJoined.peers[0]!.connectionId

    const peerJoined = await takeMessage(
      desktop.messages,
      (message) => message.type === 'peer_joined',
    )
    assert.equal(peerJoined.type, 'peer_joined')
    const mobileConnectionId = peerJoined.peer.connectionId
    assert.deepEqual(peerJoined.peer, {
      connectionId: mobileConnectionId,
      role: 'mobile',
    })

    const offer = { type: 'offer' as const, sdp: 'offer-sdp' }
    desktop.socket.send(
      JSON.stringify({
        action: 'signal',
        signal: offer,
        targetConnectionId: mobileConnectionId,
      }),
    )
    assert.deepEqual(
      await takeMessage(
        mobile.messages,
        (message) =>
          message.type === 'signal' && message.signal.type === 'offer',
      ),
      {
        type: 'signal',
        fromConnectionId: desktopConnectionId,
        signal: offer,
      },
    )

    const answer = { type: 'answer' as const, sdp: 'answer-sdp' }
    mobile.socket.send(
      JSON.stringify({
        action: 'signal',
        signal: answer,
        targetConnectionId: desktopConnectionId,
      }),
    )
    assert.deepEqual(
      await takeMessage(
        desktop.messages,
        (message) =>
          message.type === 'signal' && message.signal.type === 'answer',
      ),
      {
        type: 'signal',
        fromConnectionId: mobileConnectionId,
        signal: answer,
      },
    )

    const candidate = {
      type: 'candidate' as const,
      candidate: {
        candidate: 'candidate:1 1 UDP 1 127.0.0.1 9000 typ host',
        sdpMLineIndex: 0,
        sdpMid: '0',
      },
    }
    desktop.socket.send(
      JSON.stringify({
        action: 'signal',
        signal: candidate,
        targetConnectionId: mobileConnectionId,
      }),
    )
    assert.deepEqual(
      await takeMessage(
        mobile.messages,
        (message) =>
          message.type === 'signal' && message.signal.type === 'candidate',
      ),
      {
        type: 'signal',
        fromConnectionId: desktopConnectionId,
        signal: candidate,
      },
    )

    mobile.socket.close()
    await waitUntil(
      async () => (await connections.findById(mobileConnectionId)) === null,
    )

    desktop.socket.send(
      JSON.stringify({
        action: 'signal',
        signal: offer,
        targetConnectionId: mobileConnectionId,
      }),
    )
    assert.deepEqual(
      await takeMessage(
        desktop.messages,
        (message) =>
          message.type === 'error' && message.code === 'INVALID_TARGET',
      ),
      {
        type: 'error',
        source: 'signaling',
        code: 'INVALID_TARGET',
        message: 'O dispositivo de destino não pertence a esta sala.',
      },
    )
  })
})
