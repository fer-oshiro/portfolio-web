import { randomUUID } from 'node:crypto'
import type {
  IncomingMessage,
  RequestListener,
  ServerResponse,
} from 'node:http'

import type { Drawing } from '@fer-oshiro/realtime-contract'

import type { DrawingStorage } from '../../features/drawing'

const DEFAULT_MAX_SVG_SIZE = 1_000_000
const DRAWING_PATH = /^\/drawings\/([0-9a-f-]+)\.svg$/

interface PendingDrawing {
  id: string
}

interface StoredDrawing extends PendingDrawing {
  createdAt: number
  svg: Buffer
  url: string
}

export interface LocalDrawingStorageOptions {
  getPublicBaseUrl: () => string
  maxSvgSize?: number
}

class HttpError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
  ) {
    super(message)
  }
}

const drawingName = (name: string) => {
  const value = name.trim().replace(/\.svg$/i, '')
  return value || 'sem-nome'
}

const sendJson = (
  response: ServerResponse,
  statusCode: number,
  body: object,
) => {
  response.writeHead(statusCode, {
    'access-control-allow-origin': '*',
    'content-type': 'application/json',
  })
  response.end(JSON.stringify(body))
}

const readBody = async (request: IncomingMessage, maxSize: number) => {
  const chunks: Buffer[] = []
  let size = 0

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += buffer.byteLength

    if (size > maxSize) {
      throw new HttpError(413, 'SVG excede o limite permitido.')
    }

    chunks.push(buffer)
  }

  if (size === 0) throw new HttpError(400, 'SVG vazio.')

  return Buffer.concat(chunks)
}

export class LocalDrawingStorage implements DrawingStorage {
  private readonly maxSvgSize: number
  private readonly pending = new Map<string, PendingDrawing>()
  private readonly stored = new Map<string, StoredDrawing>()

  constructor(private readonly options: LocalDrawingStorageOptions) {
    this.maxSvgSize = options.maxSvgSize ?? DEFAULT_MAX_SVG_SIZE
  }

  async createUpload(name: string) {
    const uploadId = randomUUID()
    this.pending.set(uploadId, { id: drawingName(name) })

    return {
      url: this.urlFor(uploadId),
      method: 'PUT' as const,
      fields: {},
      expiresAt: new Date(Date.now() + 300_000).toISOString(),
      maxBytes: this.maxSvgSize,
    }
  }

  async list(): Promise<Drawing[]> {
    return [...this.stored.values()]
      .sort((left, right) => right.createdAt - left.createdAt)
      .slice(0, 20)
      .map(({ id, url }) => ({ id, url }))
  }

  async handleRequest(
    request: IncomingMessage,
    response: ServerResponse,
  ): Promise<boolean> {
    const pathname = new URL(request.url ?? '/', 'http://localhost').pathname
    const match = DRAWING_PATH.exec(pathname)
    if (!match) return false

    if (request.method === 'OPTIONS') {
      response.writeHead(204, {
        'access-control-allow-headers': 'content-type',
        'access-control-allow-methods': 'GET, PUT, OPTIONS',
        'access-control-allow-origin': '*',
      })
      response.end()
      return true
    }

    const uploadId = match[1]!

    if (request.method === 'PUT') {
      await this.upload(uploadId, request, response)
      return true
    }

    if (request.method === 'GET') {
      this.serve(uploadId, response)
      return true
    }

    response.writeHead(405, {
      allow: 'GET, PUT, OPTIONS',
      'access-control-allow-origin': '*',
    })
    response.end()
    return true
  }

  private urlFor(uploadId: string) {
    const baseUrl = this.options.getPublicBaseUrl().replace(/\/$/, '')
    return `${baseUrl}/drawings/${uploadId}.svg`
  }

  private async upload(
    uploadId: string,
    request: IncomingMessage,
    response: ServerResponse,
  ) {
    const pending = this.pending.get(uploadId)
    if (!pending) throw new HttpError(404, 'Upload não encontrado.')

    const contentType = request.headers['content-type']?.split(';')[0]
    if (contentType !== 'image/svg+xml') {
      throw new HttpError(415, 'O upload deve usar image/svg+xml.')
    }

    const svg = await readBody(request, this.maxSvgSize)
    this.pending.delete(uploadId)
    this.stored.set(uploadId, {
      ...pending,
      createdAt: Date.now(),
      svg,
      url: this.urlFor(uploadId),
    })

    response.writeHead(204, { 'access-control-allow-origin': '*' })
    response.end()
  }

  private serve(uploadId: string, response: ServerResponse) {
    const drawing = this.stored.get(uploadId)
    if (!drawing) throw new HttpError(404, 'Desenho não encontrado.')

    response.writeHead(200, {
      'access-control-allow-origin': '*',
      'cache-control': 'no-store',
      'content-length': drawing.svg.byteLength,
      'content-type': 'image/svg+xml',
    })
    response.end(drawing.svg)
  }
}

export const createLocalHttpRequestListener = (
  drawings: LocalDrawingStorage,
): RequestListener => {
  return (request, response) => {
    void (async () => {
      if (request.method === 'GET' && request.url === '/health') {
        sendJson(response, 200, { status: 'ok' })
        return
      }

      try {
        if (await drawings.handleRequest(request, response)) return
        sendJson(response, 404, { error: 'Not found' })
      } catch (error) {
        if (error instanceof HttpError) {
          sendJson(response, error.statusCode, { error: error.message })
          return
        }

        console.error('[local:http] error:', error)
        sendJson(response, 500, { error: 'Internal server error' })
      }
    })()
  }
}
