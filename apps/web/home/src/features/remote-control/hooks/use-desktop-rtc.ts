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

export const useDesktopRTC = () => {
  const setStatus = useStore(remoteControlStore, (state) => state.setStatus)
  const [gyro, setGyro] = useState({ alpha: 0, beta: 0, gamma: 0 })
  const [roomId] = useState(createRoomId)
  const { connected, iceServers, readyState } = usePeerSession({
    role: 'desktop',
    roomId,
    onData: setGyro,
    onLog: console.log,
    onSocketError: () => setStatus('server_error'),
  })

  return { connected, readyState, gyro, roomId, iceServers }
}
