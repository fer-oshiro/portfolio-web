import type {
  DeviceRole,
  GyroscopeData,
  IceServer,
} from '@fer-oshiro/realtime-contract'
import {
  gyroscopeDataSchema,
  signalDataSchema,
} from '@fer-oshiro/realtime-contract'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ReadyState } from 'react-use-websocket'
import Peer from 'simple-peer'

import { useRealtime, useRealtimeMessage } from '../realtime'

type UsePeerSessionOptions = {
  onData: (data: GyroscopeData) => void
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void
  onLog: (message: string) => void
  onSocketError?: () => void
  role: DeviceRole
  roomId: string
}

// The mobile may reconnect before the desktop has rejoined the room. Each join
// spends session quota (6 per session), so 1 join + 4 retries fits it.
const ROOM_NOT_READY_RETRY_DELAYS_MS = [3_000, 5_000, 10_000, 15_000]

const decodePeerData = (data: unknown) => {
  if (typeof data === 'string') return data
  if (data instanceof ArrayBuffer) return new TextDecoder().decode(data)
  if (ArrayBuffer.isView(data)) {
    return new TextDecoder().decode(
      new Uint8Array(data.buffer, data.byteOffset, data.byteLength),
    )
  }
  return null
}

export const usePeerSession = ({
  onData,
  onConnectionStateChange,
  onLog,
  onSocketError,
  role,
  roomId,
}: UsePeerSessionOptions) => {
  const { readyState, send } = useRealtime()
  const [connected, setConnected] =
    useState<RTCPeerConnectionState>('disconnected')
  const [iceServers, setIceServers] = useState<IceServer[]>()
  const iceServersRef = useRef<IceServer[] | undefined>(undefined)
  const peerRef = useRef<Peer.Instance | null>(null)
  const targetConnectionIdRef = useRef<string | null>(null)
  const joinRetriesRef = useRef(0)
  const joinRetryTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const onDataRef = useRef(onData)
  const onConnectionStateChangeRef = useRef(onConnectionStateChange)
  const onLogRef = useRef(onLog)

  useEffect(() => {
    onDataRef.current = onData
    onConnectionStateChangeRef.current = onConnectionStateChange
    onLogRef.current = onLog
  }, [onConnectionStateChange, onData, onLog])

  const updateConnectionState = useCallback((state: RTCPeerConnectionState) => {
    setConnected(state)
    onConnectionStateChangeRef.current?.(state)
  }, [])

  const disposePeer = useCallback(() => {
    peerRef.current?.destroy()
    peerRef.current = null
    targetConnectionIdRef.current = null
  }, [])

  const destroyPeer = useCallback(() => {
    disposePeer()
    updateConnectionState('disconnected')
  }, [disposePeer, updateConnectionState])

  const createPeer = useCallback(
    (targetConnectionId: string) => {
      if (!iceServersRef.current) return null
      if (
        peerRef.current &&
        targetConnectionIdRef.current === targetConnectionId
      ) {
        return peerRef.current
      }

      destroyPeer()
      const peer = new Peer({
        initiator: role === 'desktop',
        trickle: true,
        config: { iceServers: iceServersRef.current },
        channelName: 'gyro-data',
        channelConfig: {
          ordered: false,
          maxRetransmits: 0,
        },
      })

      targetConnectionIdRef.current = targetConnectionId
      peerRef.current = peer

      peer.on('signal', (rawSignal) => {
        const result = signalDataSchema.safeParse(rawSignal)
        if (!result.success) {
          onLogRef.current('Sinal WebRTC inválido')
          return
        }
        send({
          action: 'signal',
          targetConnectionId,
          signal: result.data,
        })
      })
      peer.on('connect', () => {
        updateConnectionState('connected')
        onLogRef.current('DataChannel aberto')
      })
      peer.on('data', (rawData: unknown) => {
        try {
          const encoded = decodePeerData(rawData)
          if (!encoded) throw new Error('Formato não suportado')
          const value: unknown = JSON.parse(encoded)
          const result = gyroscopeDataSchema.safeParse(value)
          if (!result.success) throw new Error('Payload inválido')
          onDataRef.current(result.data)
        } catch {
          onLogRef.current('Erro ao processar dados do giroscópio')
        }
      })
      peer.on('close', () => updateConnectionState('disconnected'))
      peer.on('error', (error) => {
        updateConnectionState('failed')
        onLogRef.current(`WebRTC: ${error.message}`)
      })

      return peer
    },
    [destroyPeer, role, send, updateConnectionState],
  )

  const connectToPeers = useCallback(
    (peers: { connectionId: string; role: DeviceRole }[]) => {
      const expectedRole = role === 'desktop' ? 'mobile' : 'desktop'
      const target = peers.find((peer) => peer.role === expectedRole)
      if (target) createPeer(target.connectionId)
    },
    [createPeer, role],
  )

  useRealtimeMessage('joined', (message) => {
    joinRetriesRef.current = 0
    iceServersRef.current = message.iceServers
    setIceServers(message.iceServers)
    connectToPeers(message.peers)
  })

  useRealtimeMessage('peer_joined', ({ peer }) => {
    const expectedRole = role === 'desktop' ? 'mobile' : 'desktop'
    if (peer.role === expectedRole) createPeer(peer.connectionId)
  })

  useRealtimeMessage('signal', ({ fromConnectionId, signal }) => {
    const peer = createPeer(fromConnectionId)
    peer?.signal(signal as Peer.SignalData)
  })

  useRealtimeMessage('error', ({ code, message, source }) => {
    if (source !== 'signaling') return

    const retryDelay = ROOM_NOT_READY_RETRY_DELAYS_MS[joinRetriesRef.current]
    if (code === 'ROOM_NOT_READY' && retryDelay !== undefined) {
      joinRetriesRef.current += 1
      onLogRef.current(`${message} Tentando de novo...`)
      clearTimeout(joinRetryTimerRef.current)
      joinRetryTimerRef.current = setTimeout(
        () => send({ action: 'join', roomId, role }),
        retryDelay,
      )
      return
    }

    onLogRef.current(message)
    onSocketError?.()
  })

  useEffect(() => {
    if (readyState !== ReadyState.OPEN) return

    disposePeer()
    joinRetriesRef.current = 0
    send({ action: 'join', roomId, role })

    // A pending retry belongs to this socket; a new one joins on its own
    return () => clearTimeout(joinRetryTimerRef.current)
  }, [disposePeer, readyState, role, roomId, send])

  useEffect(() => disposePeer, [disposePeer])

  const sendData = useCallback((data: GyroscopeData) => {
    if (!peerRef.current?.connected) return
    peerRef.current.send(JSON.stringify(data))
  }, [])

  return { connected, iceServers, readyState, sendData }
}
