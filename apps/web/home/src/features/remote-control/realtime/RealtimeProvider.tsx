import type { ClientMessage } from '@fer-oshiro/realtime-contract'
import { PropsWithChildren, useCallback, useEffect, useState } from 'react'
import useWebSocket from 'react-use-websocket'

import { webUrls } from '../../../config/urls'
import { RealtimeContextProvider } from './realtime-context'
import { RealtimeClient } from './realtime-client'
import { useTurnstileChallenge } from './use-turnstile-challenge'

export { useRealtime } from './use-realtime'
export { useRealtimeMessage } from './use-realtime-message'

// API Gateway closes WebSockets idle for 10 minutes. Ping before that, and
// reconnect when the pong does not come back (half-open socket). The timeout
// leaves 2 minutes after the ping because hidden tabs run timers once a minute.
const HEARTBEAT = {
  message: JSON.stringify({ action: 'ping' } satisfies ClientMessage),
  interval: 3 * 60_000,
  timeout: 5 * 60_000,
}

type RealtimeConnectionProps = {
  client: RealtimeClient
  getUrl: () => Promise<string>
  onReconnect: () => void
}

const RealtimeConnection = ({
  client,
  getUrl,
  onReconnect,
}: RealtimeConnectionProps) => {
  const { getWebSocket, sendJsonMessage, readyState } = useWebSocket(getUrl, {
    heartbeat: HEARTBEAT,
    reconnectAttempts: 10,
    reconnectInterval: (attempt) => Math.min(1_000 * 2 ** attempt, 30_000),
    retryOnError: true,
    shouldReconnect: () => true,
    onMessage: (event) => {
      try {
        const value: unknown = JSON.parse(String(event.data))
        const result = client.receive(value)
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
  })

  useEffect(() => {
    const disconnectClient = client.connect(
      (message) => sendJsonMessage(message),
      onReconnect,
    )

    return disconnectClient
  }, [client, onReconnect, sendJsonMessage])

  useEffect(() => {
    client.setReadyState(readyState)
  }, [client, readyState])

  return null
}

export const RealtimeProvider = ({ children }: PropsWithChildren) => {
  const [realtimeClient] = useState(() => new RealtimeClient())
  // Remounting the connection is the only way to get a brand-new socket from
  // react-use-websocket: it closes the old one and resets the retry counter.
  const [connectionKey, setConnectionKey] = useState(0)
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
  const reconnect = useCallback(() => setConnectionKey((key) => key + 1), [])

  return (
    <>
      <div ref={containerRef} aria-label="Verificação anti-robô" />
      <RealtimeConnection
        key={connectionKey}
        client={realtimeClient}
        getUrl={getWebSocketUrl}
        onReconnect={reconnect}
      />
      <RealtimeContextProvider client={realtimeClient}>
        {children}
      </RealtimeContextProvider>
    </>
  )
}
