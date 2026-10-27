import type {
  ClientMessage,
  ServerMessage,
  ServerMessageOf,
} from '@fer-oshiro/realtime-contract'
import {
  clientMessageSchema,
  serverMessageSchema,
} from '@fer-oshiro/realtime-contract'
import { ReadyState } from 'react-use-websocket'

type MessageListener = (message: ServerMessage) => void
type StateListener = () => void
type TransportSend = (message: ClientMessage) => void

type Transport = {
  id: symbol
  reconnect: () => void
  send: TransportSend
}

export class RealtimeClient {
  private readonly messageListeners = new Map<
    ServerMessage['type'],
    Set<MessageListener>
  >()

  private readonly stateListeners = new Set<StateListener>()
  private readonly pendingMessages: ClientMessage[] = []

  private readyState = ReadyState.UNINSTANTIATED
  private transport: Transport | null = null

  connect(send: TransportSend, reconnect: () => void = () => {}) {
    const transport: Transport = {
      id: Symbol('RealtimeTransport'),
      reconnect,
      send,
    }

    this.transport = transport
    this.flushPendingMessages()

    return () => this.disconnectTransport(transport.id)
  }

  disconnect() {
    if (!this.transport) return
    this.disconnectTransport(this.transport.id)
  }

  send = (message: ClientMessage) => {
    const parsed = clientMessageSchema.parse(message)

    if (this.transport && this.readyState === ReadyState.OPEN) {
      this.transport.send(parsed)
    } else this.pendingMessages.push(parsed)
  }

  receive = (message: unknown) => {
    const result = serverMessageSchema.safeParse(message)

    if (result.success) {
      const listeners = this.messageListeners.get(result.data.type) ?? []
      for (const listener of listeners) {
        listener(result.data)
      }
    }

    return result
  }

  subscribe = <T extends ServerMessage['type']>(
    type: T,
    handler: (message: ServerMessageOf<T>) => void,
  ) => {
    const listener = handler as MessageListener
    const typeListeners =
      this.messageListeners.get(type) ?? new Set<MessageListener>()

    typeListeners.add(listener)
    this.messageListeners.set(type, typeListeners)

    return () => {
      typeListeners.delete(listener)
      if (typeListeners.size === 0) this.messageListeners.delete(type)
    }
  }

  subscribeState = (listener: StateListener) => {
    this.stateListeners.add(listener)

    return () => {
      this.stateListeners.delete(listener)
    }
  }

  getReadyState = () => this.readyState

  /**
   * Drops the current socket and opens a fresh one. For sockets that look open
   * but stopped answering, or when automatic reconnection gave up.
   */
  reconnect = () => {
    if (!this.transport) return
    this.readyState = ReadyState.CLOSED
    this.emitStateChange()
    this.transport.reconnect()
  }

  setReadyState(readyState: ReadyState) {
    this.readyState = readyState
    this.flushPendingMessages()
    this.emitStateChange()
  }

  private disconnectTransport(transportId: symbol) {
    if (this.transport?.id !== transportId) return

    this.transport = null
    this.readyState = ReadyState.UNINSTANTIATED
    this.emitStateChange()
  }

  private emitStateChange() {
    for (const listener of this.stateListeners) listener()
  }

  private flushPendingMessages() {
    if (!this.transport || this.readyState !== ReadyState.OPEN) return

    while (this.pendingMessages.length > 0) {
      const message = this.pendingMessages.shift()
      if (message) this.transport.send(message)
    }
  }
}
