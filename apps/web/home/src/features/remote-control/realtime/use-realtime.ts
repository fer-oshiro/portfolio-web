import { useSyncExternalStore } from 'react'

import { useRealtimeClient } from './realtime-context'

export const useRealtime = () => {
  const realtimeClient = useRealtimeClient()
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
