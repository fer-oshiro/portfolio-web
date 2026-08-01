import type { ServerMessage } from '@fer-oshiro/realtime-contract'
import { renderToStaticMarkup } from 'react-dom/server'
import { ReadyState } from 'react-use-websocket'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../config/urls', () => ({
  webUrls: { websocket: 'ws://localhost' },
}))

import { RealtimeProvider, useRealtime } from './RealtimeProvider'
import { RealtimeContextProvider, useRealtimeClient } from './realtime-context'
import { RealtimeClient } from './realtime-client'

describe('RealtimeContext', () => {
  it('cria uma instância isolada para cada RealtimeProvider', () => {
    const snapshots: Array<ReturnType<typeof useRealtime>> = []

    const Probe = () => {
      snapshots.push(useRealtime())
      return null
    }

    renderToStaticMarkup(
      <>
        <RealtimeProvider>
          <Probe />
        </RealtimeProvider>
        <RealtimeProvider>
          <Probe />
        </RealtimeProvider>
      </>,
    )

    expect(snapshots).toHaveLength(2)
    expect(snapshots[0]?.send).not.toBe(snapshots[1]?.send)
    expect(snapshots[0]?.subscribe).not.toBe(snapshots[1]?.subscribe)
  })

  it('entrega a instância do provider mais próximo', () => {
    const outerClient = new RealtimeClient()
    const innerClient = new RealtimeClient()
    const clients: RealtimeClient[] = []

    const Probe = () => {
      clients.push(useRealtimeClient())
      return null
    }

    renderToStaticMarkup(
      <RealtimeContextProvider client={outerClient}>
        <Probe />
        <RealtimeContextProvider client={innerClient}>
          <Probe />
        </RealtimeContextProvider>
      </RealtimeContextProvider>,
    )

    expect(clients).toEqual([outerClient, innerClient])
  })

  it('mantém ready state, envio e subscriptions isolados por provider', () => {
    const firstClient = new RealtimeClient()
    const secondClient = new RealtimeClient()
    const firstSend = vi.fn()
    const secondSend = vi.fn()
    const firstListener = vi.fn()
    const secondListener = vi.fn()
    const snapshots: Array<ReturnType<typeof useRealtime>> = []
    const message: ServerMessage = {
      type: 'chat_chunk',
      text: 'Resposta',
    }

    firstClient.connect(firstSend)
    secondClient.connect(secondSend)
    firstClient.setReadyState(ReadyState.OPEN)
    firstClient.subscribe('chat_chunk', firstListener)
    secondClient.subscribe('chat_chunk', secondListener)

    const Probe = () => {
      snapshots.push(useRealtime())
      return null
    }

    renderToStaticMarkup(
      <>
        <RealtimeContextProvider client={firstClient}>
          <Probe />
        </RealtimeContextProvider>
        <RealtimeContextProvider client={secondClient}>
          <Probe />
        </RealtimeContextProvider>
      </>,
    )

    snapshots[0]?.send({ action: 'chat', message: 'Olá' })
    firstClient.receive(message)

    expect(snapshots.map(({ readyState }) => readyState)).toEqual([
      ReadyState.OPEN,
      ReadyState.UNINSTANTIATED,
    ])
    expect(firstSend).toHaveBeenCalledWith({
      action: 'chat',
      message: 'Olá',
    })
    expect(secondSend).not.toHaveBeenCalled()
    expect(firstListener).toHaveBeenCalledWith(message)
    expect(secondListener).not.toHaveBeenCalled()
  })

  it('falha de forma explícita quando o hook é usado fora do provider', () => {
    const Probe = () => {
      useRealtime()
      return null
    }

    expect(() => renderToStaticMarkup(<Probe />)).toThrow(
      'useRealtime deve ser usado dentro de RealtimeProvider',
    )
  })
})
