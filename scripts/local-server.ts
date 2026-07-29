import 'dotenv/config'

import type {
  DeviceRole,
  IceServer,
  ServerMessage,
} from '@fer-oshiro/realtime-contract'
import {
  clientMessageSchema,
  iceServerSchema,
} from '@fer-oshiro/realtime-contract'
import { WebSocket, WebSocketServer } from 'ws'

import { handleChat } from '../apps/backend/chat-api/src'
import { handleDrawings, handleSave } from '../apps/backend/draw-api/src'
import { IceServers } from '../apps/backend/ws-api/src/twilio'
import { WebsocketLocalProvider } from './websocket/LocalProvider'

type Connection = {
  iceServers: IceServer[]
  role: DeviceRole
  roomId: string
}

const wss = new WebSocketServer({ port: 8080 })
const clients = new Map<string, WebSocket>()
const connections = new Map<string, Connection>()
const websocket = new WebsocketLocalProvider(clients)

const send = async (connectionId: string, message: ServerMessage) =>
  websocket.sendMessage(connectionId, message)

const createIceServers = async () => {
  try {
    return iceServerSchema.array().parse(await IceServers())
  } catch {
    return [{ urls: 'stun:stun.l.google.com:19302' }]
  }
}

console.log('🚀 Servidor WebSocket unificado rodando em ws://localhost:8080')

wss.on('connection', (socket) => {
  const connectionId = `local_${crypto.randomUUID()}`
  clients.set(connectionId, socket)
  console.log(`[${connectionId}] Conectado`)

  socket.on('message', async (data) => {
    let value: unknown
    try {
      value = JSON.parse(data.toString())
    } catch {
      value = null
    }

    const parsed = clientMessageSchema.safeParse(value)
    if (!parsed.success) {
      await send(connectionId, {
        type: 'error',
        source: 'signaling',
        code: 'INVALID_MESSAGE',
        message: 'Mensagem WebSocket inválida.',
      })
      return
    }

    const message = parsed.data
    console.log(`[${connectionId}] Rota: ${message.action}`)

    if (message.action === 'join') {
      const peers = [...connections.entries()].filter(
        ([id, peer]) => id !== connectionId && peer.roomId === message.roomId,
      )
      const iceServers = peers[0]?.[1].iceServers ?? (await createIceServers())
      connections.set(connectionId, {
        roomId: message.roomId,
        role: message.role,
        iceServers,
      })

      await send(connectionId, {
        type: 'joined',
        iceServers,
        peers: peers.map(([id, peer]) => ({
          connectionId: id,
          role: peer.role,
        })),
      })
      await Promise.all(
        peers.map(([id]) =>
          send(id, {
            type: 'peer_joined',
            peer: { connectionId, role: message.role },
          }),
        ),
      )
      return
    }

    if (message.action === 'signal') {
      const source = connections.get(connectionId)
      const target = connections.get(message.targetConnectionId)
      if (!source || !target || source.roomId !== target.roomId) {
        await send(connectionId, {
          type: 'error',
          source: 'signaling',
          code: 'INVALID_TARGET',
          message: 'O dispositivo de destino não pertence a esta sala.',
        })
        return
      }
      await send(message.targetConnectionId, {
        type: 'signal',
        fromConnectionId: connectionId,
        signal: message.signal,
      })
      return
    }

    const body = data.toString()
    if (message.action === 'chat') {
      await handleChat(connectionId, websocket, body)
    } else if (message.action === 'get_drawings') {
      await handleDrawings(connectionId, websocket)
    } else if (message.action === 'save_drawing') {
      await handleSave(connectionId, websocket, body)
    }
  })

  socket.on('close', () => {
    clients.delete(connectionId)
    connections.delete(connectionId)
    console.log(`[${connectionId}] Desconectado`)
  })
})
