import type { GyroscopeData } from '@charmbyte/realtime-contract'
import { useState } from 'react'
import { ReadyState } from 'react-use-websocket'

import { usePeerSession } from './usePeerSession'

export const useMobileRTC = (onLog: (log: string) => void, roomId: string) => {
  const [gyro, setGyro] = useState<GyroscopeData>({
    alpha: 0,
    beta: 0,
    gamma: 0,
  })
  const { connected, readyState, sendData } = usePeerSession({
    role: 'mobile',
    roomId,
    onData: () => {},
    onLog,
  })

  const handleSendGyro = (input: {
    alpha: number | null
    beta: number | null
    gamma: number | null
  }) => {
    const formattedInput = {
      alpha: input.alpha !== null ? Number(input.alpha.toFixed(2)) : gyro.alpha,
      beta: input.beta !== null ? Number(input.beta.toFixed(2)) : gyro.beta,
      gamma: input.gamma !== null ? Number(input.gamma.toFixed(2)) : gyro.gamma,
    }

    setGyro(formattedInput)
    sendData(formattedInput)
  }

  return {
    connected,
    gyro,
    handleSendGyro,
    readyState: ReadyState[readyState],
  }
}
