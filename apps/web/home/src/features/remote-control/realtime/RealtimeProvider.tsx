import type {
  ServerMessage,
  ServerMessageOf,
} from '@fer-oshiro/realtime-contract'
import {
  PropsWithChildren,
  useEffect,
  useRef,
  useSyncExternalStore,
} from 'react'
import useWebSocket from 'react-use-websocket'

import { WS_URL } from './constants'
import { RealtimeClient } from './realtime-client'

const realtimeClient = new RealtimeClient()

export const RealtimeProvider = ({ children }: PropsWithChildren) => {
  const { sendJsonMessage, readyState } = useWebSocket(WS_URL, {
    reconnectAttempts: 10,
    reconnectInterval: 3000,
    retryOnError: true,
    shouldReconnect: () => true,
    onMessage: (event) => {
      try {
        const value: unknown = JSON.parse(String(event.data))
        const result = realtimeClient.receive(value)
        if (!result.success) {
          console.warn('Mensagem WebSocket inválida', result.error)
        }
      } catch (error) {
        console.warn('Erro ao processar mensagem WebSocket', error)
      }
    },
  })

  useEffect(
    () => realtimeClient.connect((message) => sendJsonMessage(message)),
    [sendJsonMessage],
  )

  useEffect(() => {
    realtimeClient.setReadyState(readyState)
  }, [readyState])

  return children
}

export const useRealtime = () => {
  const readyState = useSyncExternalStore(
    realtimeClient.subscribeState,
    realtimeClient.getReadyState,
    realtimeClient.getReadyState,
  )
  return {
    readyState,
    send: realtimeClient.send,
    subscribe: realtimeClient.subscribe,
  }
}

export const useRealtimeMessage = <T extends ServerMessage['type']>(
  type: T,
  handler: (message: ServerMessageOf<T>) => void,
) => {
  const handlerRef = useRef(handler)

  useEffect(() => {
    handlerRef.current = handler
  }, [handler])

  useEffect(
    () =>
      realtimeClient.subscribe(type, (message) => handlerRef.current(message)),
    [type],
  )
}
