import type {
  ClientMessage,
  ServerMessage,
  ServerMessageOf,
} from '@fer-oshiro/realtime-contract'
import {
  clientMessageSchema,
  serverMessageSchema,
} from '@fer-oshiro/realtime-contract'
import {
  PropsWithChildren,
  useEffect,
  useRef,
  useSyncExternalStore,
} from 'react'
import useWebSocket, { ReadyState } from 'react-use-websocket'

import { WS_URL } from './constants'

type MessageListener = (message: ServerMessage) => void
type StateListener = () => void

const messageListeners = new Map<ServerMessage['type'], Set<MessageListener>>()
const stateListeners = new Set<StateListener>()
const pendingMessages: ClientMessage[] = []

let currentReadyState = ReadyState.UNINSTANTIATED
let transportSend: ((message: ClientMessage) => void) | null = null
let transportOwner: symbol | null = null

const emitStateChange = () => {
  for (const listener of stateListeners) listener()
}

const dispatch = (message: ServerMessage) => {
  for (const listener of messageListeners.get(message.type) ?? []) {
    listener(message)
  }
}

const send = (message: ClientMessage) => {
  const parsed = clientMessageSchema.parse(message)
  if (transportSend) transportSend(parsed)
  else pendingMessages.push(parsed)
}

const subscribe = <T extends ServerMessage['type']>(
  type: T,
  handler: (message: ServerMessageOf<T>) => void,
) => {
  const listener = handler as MessageListener
  const typeListeners = messageListeners.get(type) ?? new Set<MessageListener>()
  typeListeners.add(listener)
  messageListeners.set(type, typeListeners)

  return () => {
    typeListeners.delete(listener)
    if (typeListeners.size === 0) messageListeners.delete(type)
  }
}

const subscribeState = (listener: StateListener) => {
  stateListeners.add(listener)
  return () => {
    stateListeners.delete(listener)
  }
}

const getReadyState = () => currentReadyState

export const RealtimeProvider = ({ children }: PropsWithChildren) => {
  const owner = useRef(Symbol('RealtimeProvider'))
  const { sendJsonMessage, readyState } = useWebSocket(WS_URL, {
    reconnectAttempts: 10,
    reconnectInterval: 3000,
    retryOnError: true,
    shouldReconnect: () => true,
    onMessage: (event) => {
      try {
        const value: unknown = JSON.parse(String(event.data))
        const result = serverMessageSchema.safeParse(value)
        if (result.success) dispatch(result.data)
        else console.warn('Mensagem WebSocket inválida', result.error)
      } catch (error) {
        console.warn('Erro ao processar mensagem WebSocket', error)
      }
    },
  })

  useEffect(() => {
    const currentOwner = owner.current
    transportOwner = currentOwner
    transportSend = (message) => sendJsonMessage(message)

    while (pendingMessages.length > 0) {
      const message = pendingMessages.shift()
      if (message) transportSend(message)
    }

    return () => {
      if (transportOwner !== currentOwner) return
      transportOwner = null
      transportSend = null
      currentReadyState = ReadyState.UNINSTANTIATED
      emitStateChange()
    }
  }, [sendJsonMessage])

  useEffect(() => {
    currentReadyState = readyState
    emitStateChange()
  }, [readyState])

  return children
}

export const useRealtime = () => {
  const readyState = useSyncExternalStore(
    subscribeState,
    getReadyState,
    getReadyState,
  )
  return { readyState, send, subscribe }
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
    () => subscribe(type, (message) => handlerRef.current(message)),
    [type],
  )
}
