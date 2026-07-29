import { useState } from 'react'

import { useStore } from '../store'
import { usePeerSession } from './usePeerSession'

const roomId = crypto.randomUUID?.() ?? '666'

export const useDesktopRTC = () => {
  const { setStatus } = useStore()
  const [gyro, setGyro] = useState({ alpha: 0, beta: 0, gamma: 0 })
  const { connected, iceServers, readyState } = usePeerSession({
    role: 'desktop',
    roomId,
    onData: setGyro,
    onLog: console.log,
    onSocketError: () => setStatus('server_error'),
  })

  return { connected, readyState, gyro, roomId, iceServers }
}
