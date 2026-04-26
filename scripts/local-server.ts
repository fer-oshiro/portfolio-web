import 'dotenv/config'
import { WebSocketServer } from 'ws'
import { handler as wsHandler } from '../apps/ws-api/src'
import { handleChat as chatHandler } from '../apps/chat-api/src'
import { WebsocketLocalProvider } from './websocket/LocalProvider'
import { handleDrawings, handleSave } from '../apps/draw-api/src'

const wss = new WebSocketServer({ port: 8080 })
const clients = new Map()
const websocket = new WebsocketLocalProvider(clients)

console.log('🚀 Servidor WebSocket unificado rodando em ws://localhost:8080')

wss.on('connection', (ws) => {
  const connectionId = `local_${Math.random().toString(36).substr(2, 9)}`
  console.log(`[${connectionId}] Conectado`)
  clients.set(connectionId, ws)

  websocket.clients = clients
  // Simula o evento $connect
  const connectEvent = createEvent('$connect', connectionId)
  wsHandler(connectEvent, {} as any, () => {})

  ws.on('message', async (data) => {
    const message = JSON.parse(data.toString())
    const routeKey = message.action // O roteamento acontece aqui!

    console.log(`[${connectionId}] Rota: ${routeKey}`)

    const event = createEvent(routeKey, connectionId, data.toString())

    // Roteamento manual simulando o API Gateway
    if (['join', 'offer', 'answer', 'iceCandidate'].includes(routeKey)) {
      await wsHandler(event, {} as any, () => {})
    } else if (routeKey === 'chat') {
      await chatHandler(connectionId, websocket, data.toString())
    } else if (routeKey === 'get_drawings') {
      await handleDrawings(connectionId, websocket, data.toString())
    } else if (routeKey === 'save_drawing') {
      await handleSave(connectionId, websocket, data.toString())
    }
  })

  ws.on('close', () => {
    const disconnectEvent = createEvent('$disconnect', connectionId)
    wsHandler(disconnectEvent, {} as any, () => {})
    console.log(`[${connectionId}] Desconectado`)
  })
})

// Helper para criar o objeto 'event' que a Lambda espera
function createEvent(routeKey: string, connectionId: string, body?: string) {
  return {
    requestContext: {
      routeKey,
      connectionId,
      domainName: 'localhost',
      stage: 'local',
    },
    body,
  } as any
}
