import type {
  ClientMessage,
  ServerMessage,
  ServerMessageOf,
} from '@fer-oshiro/realtime-contract'
import { ReadyState } from 'react-use-websocket'

export type UploadGrant = ServerMessageOf<'upload_grant'>

export type DrawingRealtime = {
  getReadyState(): ReadyState
  reconnect(): void
  send(message: ClientMessage): void
  subscribe<T extends ServerMessage['type']>(
    type: T,
    handler: (message: ServerMessageOf<T>) => void,
  ): () => void
  subscribeState(listener: () => void): () => void
}

export const SAVE_ATTEMPTS = 3
export const RETRY_DELAYS_MS = [2_000, 5_000]

const DEFAULT_TIMEOUTS = {
  // Covers a reconnect with a fresh Turnstile challenge and backoff
  connectMs: 20_000,
  responseMs: 15_000,
}

/** Retrying cannot fix it (quota, size limit): stop and tell the user. */
export class PermanentSaveError extends Error {}

/**
 * The socket never opened or stopped answering. Automatic reconnection may
 * have given up, or the socket is half-open: the next attempt needs a new one.
 */
export class StaleConnectionError extends Error {}

const legacyGrant = (url: string): UploadGrant => ({
  type: 'upload_grant',
  url,
  method: 'PUT',
  fields: {},
  expiresAt: new Date().toISOString(),
  maxBytes: Number.MAX_SAFE_INTEGER,
})

/**
 * Sends save_drawing once the socket is open and resolves with its grant.
 * The grant is addressed to the requesting connection, so losing the socket
 * after sending fails the attempt instead of waiting forever.
 */
export const requestUploadGrant = (
  realtime: DrawingRealtime,
  name: string,
  timeouts = DEFAULT_TIMEOUTS,
) =>
  new Promise<UploadGrant>((resolve, reject) => {
    let sent = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const unsubscribers: Array<() => void> = []

    const finish = (settle: () => void) => {
      clearTimeout(timer)
      unsubscribers.splice(0).forEach((unsubscribe) => unsubscribe())
      settle()
    }
    const fail = (error: Error) => finish(() => reject(error))
    const startTimer = (ms: number, message: string) => {
      clearTimeout(timer)
      timer = setTimeout(() => fail(new StaleConnectionError(message)), ms)
    }
    const sendWhenOpen = () => {
      if (realtime.getReadyState() !== ReadyState.OPEN) {
        if (sent) fail(new Error('Conexão perdida durante o envio'))
        return
      }
      if (sent) return

      sent = true
      startTimer(timeouts.responseMs, 'Sem resposta do servidor')
      realtime.send({ action: 'save_drawing', name })
    }

    unsubscribers.push(
      realtime.subscribe('upload_grant', (grant) =>
        finish(() => resolve(grant)),
      ),
      realtime.subscribe('upload_url', ({ url }) =>
        finish(() => resolve(legacyGrant(url))),
      ),
      realtime.subscribe('error', ({ code, message, source }) => {
        if (!sent) return
        if (source === 'security' && code === 'QUOTA_EXCEEDED') {
          fail(new PermanentSaveError(message))
        } else if (source === 'draw' || source === 'security') {
          // SESSION_EXPIRED: the provider reconnects; the retry uses the new one
          fail(new Error(message))
        }
      }),
      realtime.subscribeState(sendWhenOpen),
    )

    startTimer(timeouts.connectMs, 'Sem conexão com o servidor')
    sendWhenOpen()
  })

export const uploadSvg = async (grant: UploadGrant, svg: string) => {
  const blob = new Blob([svg], { type: 'image/svg+xml' })
  if (blob.size > grant.maxBytes) {
    throw new PermanentSaveError('O desenho excede o limite permitido.')
  }

  let response: Response
  if (grant.method === 'POST') {
    const form = new FormData()
    for (const [field, value] of Object.entries(grant.fields)) {
      form.append(field, value)
    }
    form.append('file', blob, 'drawing.svg')
    response = await fetch(grant.url, { method: 'POST', body: form })
  } else {
    response = await fetch(grant.url, {
      method: 'PUT',
      body: blob,
      headers: { 'Content-Type': 'image/svg+xml' },
    })
  }

  if (!response.ok) throw new Error(`Upload falhou: ${response.status}`)
}

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms))

type RetryOptions = {
  attempts?: number
  delaysMs?: number[]
  onAttempt?: (attempt: number) => void
  sleep?: (ms: number) => Promise<void>
}

export const withRetry = async <T>(
  run: () => Promise<T>,
  {
    attempts = SAVE_ATTEMPTS,
    delaysMs = RETRY_DELAYS_MS,
    onAttempt,
    sleep = wait,
  }: RetryOptions = {},
): Promise<T> => {
  for (let attempt = 1; ; attempt++) {
    onAttempt?.(attempt)
    try {
      return await run()
    } catch (error) {
      if (error instanceof PermanentSaveError || attempt >= attempts) {
        throw error
      }
      await sleep(delaysMs[attempt - 1] ?? delaysMs.at(-1) ?? 0)
    }
  }
}

export const saveDrawing = (
  realtime: DrawingRealtime,
  { name, svg }: { name: string; svg: string },
  options?: RetryOptions,
) =>
  withRetry(async () => {
    try {
      const grant = await requestUploadGrant(realtime, name)
      await uploadSvg(grant, svg)
    } catch (error) {
      if (error instanceof StaleConnectionError) realtime.reconnect()
      throw error
    }
  }, options)
