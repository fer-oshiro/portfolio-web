import 'dotenv/config'

import { randomUUID } from 'node:crypto'
import { createServer, type RequestListener, type Server } from 'node:http'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import OpenAI from 'openai'
import { WebSocket, WebSocketServer } from 'ws'

import { GroqChatProvider } from '../adapters/aws/groq-chat'
import { LocalChatProvider } from '../adapters/local/local-chat'
import {
  createLocalHttpRequestListener,
  LocalDrawingStorage,
} from '../adapters/local/local-drawings'
import { LocalTurnProvider } from '../adapters/local/local-turn'
import { LocalWebSocketMessagePublisher } from '../adapters/local/local-websocket-publisher'
import { MemoryConnectionRepository } from '../adapters/local/memory-connections'
import { loadLocalEnvironment } from '../config/env'
import { ChatService, type ChatProvider } from '../features/chat'
import { DrawingService } from '../features/drawing'
import { SignalingService } from '../features/signaling'
import { LocalMessageDispatcher } from './local/dispatcher'

export interface LocalDispatcher {
  disconnect(connectionId: string): Promise<void>
  dispatch(connectionId: string, rawMessage: string): Promise<void>
}

export interface LocalServerOptions {
  clients?: Map<string, WebSocket>
  dispatcher: LocalDispatcher
  host?: string
  port?: number
  requestListener?: RequestListener
}

export interface LocalServer {
  clients: Map<string, WebSocket>
  close(): Promise<void>
  httpServer: Server
  start(): Promise<void>
  webSocketServer: WebSocketServer
}

export interface LocalApplicationOptions {
  chatProvider?: ChatProvider
  clients?: Map<string, WebSocket>
  groqApiKey?: string
  host?: string
  port?: number
}

export interface LocalApplication extends LocalServer {
  drawings: LocalDrawingStorage
}

const defaultRequestListener: RequestListener = (request, response) => {
  if (request.method === 'GET' && request.url === '/health') {
    response.writeHead(200, { 'content-type': 'application/json' })
    response.end(JSON.stringify({ status: 'ok' }))
    return
  }

  response.writeHead(404, { 'content-type': 'application/json' })
  response.end(JSON.stringify({ error: 'Not found' }))
}

export const createLocalServer = ({
  clients = new Map<string, WebSocket>(),
  dispatcher,
  host = 'localhost',
  port = 8080,
  requestListener = defaultRequestListener,
}: LocalServerOptions): LocalServer => {
  const httpServer = createServer(requestListener)
  const webSocketServer = new WebSocketServer({ server: httpServer })

  webSocketServer.on('connection', (socket) => {
    const connectionId = `local_${randomUUID()}`
    let messageQueue = Promise.resolve()
    clients.set(connectionId, socket)

    socket.on('message', (data) => {
      const rawMessage = data.toString()
      messageQueue = messageQueue
        .then(() => dispatcher.dispatch(connectionId, rawMessage))
        .catch((error) =>
          console.error(`[local:${connectionId}] dispatch error:`, error),
        )
    })

    socket.on('close', () => {
      clients.delete(connectionId)
      void messageQueue
        .then(() => dispatcher.disconnect(connectionId))
        .catch((error) =>
          console.error(`[local:${connectionId}] disconnect error:`, error),
        )
    })
  })

  return {
    clients,
    httpServer,
    webSocketServer,
    start: () =>
      new Promise<void>((resolve, reject) => {
        const onError = (error: Error) => {
          httpServer.off('listening', onListening)
          reject(error)
        }
        const onListening = () => {
          httpServer.off('error', onError)
          resolve()
        }

        httpServer.once('error', onError)
        httpServer.once('listening', onListening)
        httpServer.listen(port, host)
      }),
    close: () =>
      new Promise<void>((resolve, reject) => {
        webSocketServer.close()
        httpServer.close((error) => {
          if (error) reject(error)
          else resolve()
        })
      }),
  }
}

export const createLocalChatProvider = (groqApiKey?: string): ChatProvider => {
  if (!groqApiKey) return new LocalChatProvider()

  return new GroqChatProvider(
    new OpenAI({
      apiKey: groqApiKey,
      baseURL: 'https://api.groq.com/openai/v1',
    }),
  )
}

export const createLocalApplication = ({
  chatProvider,
  clients = new Map<string, WebSocket>(),
  groqApiKey,
  host = 'localhost',
  port = 8080,
}: LocalApplicationOptions = {}): LocalApplication => {
  const publicHost = host === '0.0.0.0' ? 'localhost' : host
  const drawings = new LocalDrawingStorage({
    getPublicBaseUrl: () => {
      const address = server.httpServer.address()
      const listeningPort =
        address && typeof address === 'object' ? address.port : port
      return `http://${publicHost}:${listeningPort}`
    },
  })
  const publisher = new LocalWebSocketMessagePublisher(clients)
  const dispatcher = new LocalMessageDispatcher({
    chat: new ChatService({
      provider: chatProvider ?? createLocalChatProvider(groqApiKey),
      publisher,
    }),
    drawing: new DrawingService({ publisher, storage: drawings }),
    publisher,
    signaling: new SignalingService({
      connections: new MemoryConnectionRepository(),
      publisher,
      turn: new LocalTurnProvider(),
    }),
  })

  const server = createLocalServer({
    clients,
    dispatcher,
    host,
    port,
    requestListener: createLocalHttpRequestListener(drawings),
  })

  return { ...server, drawings }
}

const isMainModule =
  process.argv[1] !== undefined &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isMainModule) {
  const environment = loadLocalEnvironment()
  const application = createLocalApplication({
    groqApiKey: environment.groqApiKey,
    host: environment.host,
    port: environment.port,
  })

  void application
    .start()
    .then(() => {
      const address = application.httpServer.address()
      const listeningPort =
        address && typeof address === 'object' ? address.port : environment.port
      console.log(
        `Servidor local disponível em http://localhost:${listeningPort}`,
      )
    })
    .catch((error) => {
      console.error('Não foi possível iniciar o servidor local:', error)
      process.exitCode = 1
    })
}
