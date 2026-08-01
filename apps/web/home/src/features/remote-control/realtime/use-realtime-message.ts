import type {
  ServerMessage,
  ServerMessageOf,
} from '@fer-oshiro/realtime-contract'
import { useEffect, useRef } from 'react'

import { useRealtimeClient } from './realtime-context'

export const useRealtimeMessage = <T extends ServerMessage['type']>(
  type: T,
  handler: (message: ServerMessageOf<T>) => void,
) => {
  const realtimeClient = useRealtimeClient()
  const handlerRef = useRef(handler)

  useEffect(() => {
    handlerRef.current = handler
  }, [handler])

  useEffect(
    () =>
      realtimeClient.subscribe(type, (message) => handlerRef.current(message)),
    [realtimeClient, type],
  )
}
