import { PropsWithChildren, useCallback, useEffect, useState } from 'react'
import useWebSocket from 'react-use-websocket'

import { webUrls } from '../../../config/urls'
import { RealtimeContextProvider } from './realtime-context'
import { RealtimeClient } from './realtime-client'
import { useTurnstileChallenge } from './use-turnstile-challenge'

export { useRealtime } from './use-realtime'
export { useRealtimeMessage } from './use-realtime-message'

export const RealtimeProvider = ({ children }: PropsWithChildren) => {
  const [realtimeClient] = useState(() => new RealtimeClient())
  const { containerRef, getChallengeToken } = useTurnstileChallenge(
    webUrls.turnstileSiteKey,
  )
  const getWebSocketUrl = useCallback(async () => {
    const challenge = await getChallengeToken()
    if (!challenge) return webUrls.websocket

    const url = new URL(webUrls.websocket)
    url.searchParams.set('challenge', challenge)
    return url.toString()
  }, [getChallengeToken])
  const { getWebSocket, sendJsonMessage, readyState } = useWebSocket(
    getWebSocketUrl,
    {
      reconnectAttempts: 10,
      reconnectInterval: (attempt) => Math.min(1_000 * 2 ** attempt, 30_000),
      retryOnError: true,
      shouldReconnect: () => true,
      onMessage: (event) => {
        try {
          const value: unknown = JSON.parse(String(event.data))
          const result = realtimeClient.receive(value)
          if (!result.success) {
            console.warn('Mensagem WebSocket inválida', result.error)
          } else if (
            result.data.type === 'error' &&
            result.data.code === 'SESSION_EXPIRED'
          ) {
            getWebSocket()?.close(4001, 'Session expired')
          }
        } catch (error) {
          console.warn('Erro ao processar mensagem WebSocket', error)
        }
      },
    },
  )

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
    <>
      <div ref={containerRef} aria-label="Verificação anti-robô" />
      <RealtimeContextProvider client={realtimeClient}>
        {children}
      </RealtimeContextProvider>
    </>
  )
}
