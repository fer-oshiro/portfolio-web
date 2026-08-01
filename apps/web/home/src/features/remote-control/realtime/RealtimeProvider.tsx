import { PropsWithChildren, useEffect, useState } from 'react'
import useWebSocket from 'react-use-websocket'

import { WS_URL } from './constants'
import { RealtimeContextProvider } from './realtime-context'
import { RealtimeClient } from './realtime-client'

export { useRealtime } from './use-realtime'
export { useRealtimeMessage } from './use-realtime-message'

export const RealtimeProvider = ({ children }: PropsWithChildren) => {
  const [realtimeClient] = useState(() => new RealtimeClient())
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

  useEffect(() => {
    const disconnectClient = realtimeClient.connect((message) =>
      sendJsonMessage(message),
    )

    return disconnectClient
  }, [realtimeClient, sendJsonMessage])

  useEffect(() => {
    realtimeClient.setReadyState(readyState)
  }, [readyState, realtimeClient])

  return (
    <RealtimeContextProvider client={realtimeClient}>
      {children}
    </RealtimeContextProvider>
  )
}
