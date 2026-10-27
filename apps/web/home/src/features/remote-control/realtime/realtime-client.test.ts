import type {
  ClientMessage,
  ServerMessage,
} from '@fer-oshiro/realtime-contract'
import { ReadyState } from 'react-use-websocket'
import { describe, expect, it, vi } from 'vitest'

import { RealtimeClient } from './realtime-client'

const chatMessage: ClientMessage = {
  action: 'chat',
  message: 'Olá',
}

describe('RealtimeClient', () => {
  it('enfileira antes de OPEN e preserva a ordem no flush', () => {
    const client = new RealtimeClient()
    const send = vi.fn()
    const getDrawingsMessage: ClientMessage = { action: 'get_drawings' }

    client.send(chatMessage)
    client.connect(send)
    client.send(getDrawingsMessage)

    expect(send).not.toHaveBeenCalled()

    client.setReadyState(ReadyState.OPEN)

    expect(send.mock.calls).toEqual([[chatMessage], [getDrawingsMessage]])
  })

  it('envia imediatamente quando há um transporte conectado', () => {
    const client = new RealtimeClient()
    const send = vi.fn()

    client.connect(send)
    client.setReadyState(ReadyState.OPEN)
    client.send(chatMessage)

    expect(send).toHaveBeenCalledOnce()
    expect(send).toHaveBeenCalledWith(chatMessage)
  })

  it('mantém o transporte mais recente ao limpar uma conexão antiga', () => {
    const client = new RealtimeClient()
    const firstSend = vi.fn()
    const secondSend = vi.fn()
    const disconnectFirst = client.connect(firstSend)

    client.connect(secondSend)
    client.setReadyState(ReadyState.OPEN)
    disconnectFirst()
    client.send(chatMessage)

    expect(firstSend).not.toHaveBeenCalled()
    expect(secondSend).toHaveBeenCalledWith(chatMessage)
  })

  it('reconnect fecha o estado e pede um socket novo ao transporte', () => {
    const client = new RealtimeClient()
    const reconnect = vi.fn()
    const stateListener = vi.fn()

    client.connect(vi.fn(), reconnect)
    client.setReadyState(ReadyState.OPEN)
    client.subscribeState(stateListener)
    client.reconnect()

    expect(reconnect).toHaveBeenCalledOnce()
    expect(client.getReadyState()).toBe(ReadyState.CLOSED)
    expect(stateListener).toHaveBeenCalledOnce()
  })

  it('volta a enfileirar depois de desconectar e envia no reconnect', () => {
    const client = new RealtimeClient()
    const firstSend = vi.fn()
    const secondSend = vi.fn()

    client.connect(firstSend)
    client.setReadyState(ReadyState.OPEN)
    client.disconnect()
    client.send(chatMessage)
    client.connect(secondSend)
    client.setReadyState(ReadyState.OPEN)

    expect(firstSend).not.toHaveBeenCalled()
    expect(secondSend).toHaveBeenCalledWith(chatMessage)
  })

  it('segura mensagens durante uma reconexão até o próximo OPEN', () => {
    const client = new RealtimeClient()
    const send = vi.fn()

    client.connect(send)
    client.setReadyState(ReadyState.OPEN)
    client.setReadyState(ReadyState.CONNECTING)
    client.send(chatMessage)

    expect(send).not.toHaveBeenCalled()

    client.setReadyState(ReadyState.OPEN)

    expect(send).toHaveBeenCalledWith(chatMessage)
  })

  it('faz dispatch por tipo e respeita unsubscribe', () => {
    const client = new RealtimeClient()
    const listener = vi.fn()
    const message: ServerMessage = {
      type: 'chat_chunk',
      text: 'Resposta',
    }
    const unsubscribe = client.subscribe('chat_chunk', listener)

    client.receive(message)
    unsubscribe()
    client.receive(message)

    expect(listener).toHaveBeenCalledOnce()
    expect(listener).toHaveBeenCalledWith(message)
  })

  it('rejeita mensagens recebidas inválidas antes do dispatch', () => {
    const client = new RealtimeClient()
    const listener = vi.fn()

    client.subscribe('chat_chunk', listener)
    const result = client.receive({
      type: 'chat_chunk',
      text: 123,
    })

    expect(result.success).toBe(false)
    expect(listener).not.toHaveBeenCalled()
  })

  it('notifica mudanças de estado e respeita unsubscribe', () => {
    const client = new RealtimeClient()
    const listener = vi.fn()
    const unsubscribe = client.subscribeState(listener)

    client.setReadyState(ReadyState.OPEN)

    expect(client.getReadyState()).toBe(ReadyState.OPEN)
    expect(listener).toHaveBeenCalledOnce()

    unsubscribe()
    client.setReadyState(ReadyState.CLOSED)

    expect(client.getReadyState()).toBe(ReadyState.CLOSED)
    expect(listener).toHaveBeenCalledOnce()
  })

  it('restaura o estado inicial ao desconectar', () => {
    const client = new RealtimeClient()
    const listener = vi.fn()

    client.subscribeState(listener)
    client.connect(vi.fn())
    client.setReadyState(ReadyState.OPEN)
    client.disconnect()

    expect(client.getReadyState()).toBe(ReadyState.UNINSTANTIATED)
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it('valida mensagens antes de enfileirar ou enviar', () => {
    const client = new RealtimeClient()

    expect(() =>
      client.send({
        action: 'chat',
        message: '',
      }),
    ).toThrow()
  })
})
