import type { GyroscopeData } from '@fer-oshiro/realtime-contract'
import { useState } from 'react'
import { useStore } from 'zustand'

import { remoteControlStore } from '../remote-control-store'
import { usePeerSession } from './use-peer-session'

const createRoomId = () => {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()

  const randomValues = crypto.getRandomValues(new Uint32Array(4))
  return [...randomValues]
    .map((value) => value.toString(16).padStart(8, '0'))
    .join('-')
}

const ignoreGyro = () => {}

export const useDesktopRTC = (
  onGyro: (gyro: GyroscopeData) => void = ignoreGyro,
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void,
) => {
  const setStatus = useStore(remoteControlStore, (state) => state.setStatus)
  const [roomId] = useState(createRoomId)
  const { connected, iceServers, readyState } = usePeerSession({
    role: 'desktop',
    roomId,
    onData: onGyro,
    onConnectionStateChange,
    onLog: console.log,
    onSocketError: () => setStatus('server_error'),
  })

  return { connected, readyState, roomId, iceServers }
}
