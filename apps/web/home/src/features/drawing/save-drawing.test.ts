import type { ServerMessage } from '@fer-oshiro/realtime-contract'
import { ReadyState } from 'react-use-websocket'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  type DrawingRealtime,
  PermanentSaveError,
  requestUploadGrant,
  saveDrawing,
  StaleConnectionError,
  withRetry,
} from './save-drawing'

class FakeRealtime implements DrawingRealtime {
  readonly reconnect = vi.fn()
  readonly send = vi.fn()
  private readonly listeners = new Set<(message: ServerMessage) => void>()
  private readonly stateListeners = new Set<() => void>()

  constructor(private readyState: ReadyState) {}

  get listenerCount() {
    return this.listeners.size + this.stateListeners.size
  }

  getReadyState = () => this.readyState

  setReadyState(readyState: ReadyState) {
    this.readyState = readyState
    this.stateListeners.forEach((listener) => listener())
  }

  receive(message: ServerMessage) {
    this.listeners.forEach((listener) => listener(message))
  }

  subscribe: DrawingRealtime['subscribe'] = (type, handler) => {
    const listener = (message: ServerMessage) => {
      if (message.type === type) handler(message as never)
    }
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  subscribeState = (listener: () => void) => {
    this.stateListeners.add(listener)
    return () => this.stateListeners.delete(listener)
  }
}

const grant: ServerMessage = {
  type: 'upload_grant',
  url: 'https://uploads.example.com',
  method: 'POST',
  fields: { key: 'submissions/id.svg' },
  expiresAt: '2026-10-27T12:00:00.000Z',
  maxBytes: 1_000_000,
}

const createRealtime = (readyState = ReadyState.OPEN) => {
  const client = new FakeRealtime(readyState)
  return { client, send: client.send }
}

describe('requestUploadGrant', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('envia save_drawing e resolve com o grant', async () => {
    const { client, send } = createRealtime()
    const request = requestUploadGrant(client, 'Fer')

    expect(send).toHaveBeenCalledWith({ action: 'save_drawing', name: 'Fer' })
    client.receive(grant)

    await expect(request).resolves.toEqual(grant)
  })

  it('espera a reconexão antes de enviar', async () => {
    const { client, send } = createRealtime(ReadyState.CLOSED)
    const request = requestUploadGrant(client, 'Fer')

    expect(send).not.toHaveBeenCalled()
    client.setReadyState(ReadyState.OPEN)
    expect(send).toHaveBeenCalledOnce()
    client.receive(grant)

    await expect(request).resolves.toEqual(grant)
  })

  it('falha quando a conexão cai depois do envio', async () => {
    const { client } = createRealtime()
    const request = requestUploadGrant(client, 'Fer')

    client.setReadyState(ReadyState.CLOSED)

    await expect(request).rejects.toThrow('Conexão perdida')
  })

  it('falha sem resposta do servidor', async () => {
    const { client } = createRealtime()
    const request = requestUploadGrant(client, 'Fer')
    const assertion = expect(request).rejects.toThrow(StaleConnectionError)

    await vi.advanceTimersByTimeAsync(15_000)
    await assertion
  })

  it('falha quando o socket não abre a tempo', async () => {
    const { client, send } = createRealtime(ReadyState.CLOSED)
    const request = requestUploadGrant(client, 'Fer')
    const assertion = expect(request).rejects.toThrow(StaleConnectionError)

    await vi.advanceTimersByTimeAsync(20_000)
    await assertion
    expect(send).not.toHaveBeenCalled()
  })

  it('não tenta de novo quando a quota acabou', async () => {
    const { client } = createRealtime()
    const request = requestUploadGrant(client, 'Fer')

    client.receive({
      type: 'error',
      source: 'security',
      code: 'QUOTA_EXCEEDED',
      message: 'Limite atingido',
    })

    await expect(request).rejects.toBeInstanceOf(PermanentSaveError)
  })

  it('para de ouvir mensagens depois de resolver', async () => {
    const { client } = createRealtime()
    const request = requestUploadGrant(client, 'Fer')
    client.receive(grant)
    await request

    expect(client.listenerCount).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('saveDrawing', () => {
  const drawing = { name: 'Fer', svg: '<svg />' }
  const noSleep = async () => undefined

  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 204 })),
    )
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('pede um socket novo quando a tentativa fica sem resposta', async () => {
    const { client, send } = createRealtime()
    client.reconnect.mockImplementation(() =>
      client.setReadyState(ReadyState.CLOSED),
    )
    const save = saveDrawing(client, drawing, { sleep: noSleep })

    await vi.advanceTimersByTimeAsync(15_000)
    expect(client.reconnect).toHaveBeenCalledOnce()
    expect(send).toHaveBeenCalledOnce()

    client.setReadyState(ReadyState.OPEN)
    expect(send).toHaveBeenCalledTimes(2)
    client.receive(grant)

    await expect(save).resolves.toBeUndefined()
    expect(fetch).toHaveBeenCalledOnce()
  })

  it('repete no mesmo socket quando o servidor responde erro', async () => {
    const { client, send } = createRealtime()
    const save = saveDrawing(client, drawing, { sleep: noSleep })

    client.receive({
      type: 'error',
      source: 'draw',
      code: 'INTERNAL_ERROR',
      message: 'Falhou',
    })
    await vi.advanceTimersByTimeAsync(0)
    expect(send).toHaveBeenCalledTimes(2)
    client.receive(grant)

    await expect(save).resolves.toBeUndefined()
    expect(client.reconnect).not.toHaveBeenCalled()
  })
})

describe('withRetry', () => {
  it('tenta 3 vezes com espera entre as tentativas', async () => {
    const sleep = vi.fn(async () => undefined)
    const attempts: number[] = []
    const run = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error('caiu'))
      .mockRejectedValueOnce(new Error('caiu'))
      .mockResolvedValueOnce('ok')

    await expect(
      withRetry(run, {
        sleep,
        onAttempt: (attempt) => attempts.push(attempt),
      }),
    ).resolves.toBe('ok')

    expect(attempts).toEqual([1, 2, 3])
    expect(sleep.mock.calls).toEqual([[2_000], [5_000]])
  })

  it('desiste depois da terceira falha', async () => {
    const sleep = vi.fn(async () => undefined)
    const run = vi.fn(async () => {
      throw new Error('caiu')
    })

    await expect(withRetry(run, { sleep })).rejects.toThrow('caiu')
    expect(run).toHaveBeenCalledTimes(3)
    expect(sleep).toHaveBeenCalledTimes(2)
  })

  it('não repete erros permanentes', async () => {
    const sleep = vi.fn(async () => undefined)
    const run = vi.fn(async () => {
      throw new PermanentSaveError('grande demais')
    })

    await expect(withRetry(run, { sleep })).rejects.toThrow('grande demais')
    expect(run).toHaveBeenCalledOnce()
    expect(sleep).not.toHaveBeenCalled()
  })
})
