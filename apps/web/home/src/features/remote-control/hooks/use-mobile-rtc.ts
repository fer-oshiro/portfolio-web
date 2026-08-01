import type { GyroscopeData } from '@fer-oshiro/realtime-contract'
import { useCallback, useRef } from 'react'
import { ReadyState } from 'react-use-websocket'

import { usePeerSession } from './use-peer-session'

export const useMobileRTC = (onLog: (log: string) => void, roomId: string) => {
  const gyro = useRef<GyroscopeData>({
    alpha: 0,
    beta: 0,
    gamma: 0,
  })
  const gyroListeners = useRef(new Set<() => void>())
  const { connected, readyState, sendData } = usePeerSession({
    role: 'mobile',
    roomId,
    onData: () => {},
    onLog,
  })

  const handleSendGyro = useCallback(
    (input: {
      alpha: number | null
      beta: number | null
      gamma: number | null
    }) => {
      const previousGyro = gyro.current
      const formattedInput = {
        alpha:
          input.alpha !== null
            ? Number(input.alpha.toFixed(2))
            : previousGyro.alpha,
        beta:
          input.beta !== null
            ? Number(input.beta.toFixed(2))
            : previousGyro.beta,
        gamma:
          input.gamma !== null
            ? Number(input.gamma.toFixed(2))
            : previousGyro.gamma,
      }

      gyro.current = formattedInput
      sendData(formattedInput)

      if (
        formattedInput.alpha !== previousGyro.alpha ||
        formattedInput.beta !== previousGyro.beta ||
        formattedInput.gamma !== previousGyro.gamma
      ) {
        gyroListeners.current.forEach((listener) => listener())
      }
    },
    [sendData],
  )

  const subscribeGyro = useCallback((listener: () => void) => {
    gyroListeners.current.add(listener)
    return () => {
      gyroListeners.current.delete(listener)
    }
  }, [])

  const getGyroSnapshot = useCallback(() => gyro.current, [])

  return {
    connected,
    getGyroSnapshot,
    handleSendGyro,
    readyState: ReadyState[readyState],
    subscribeGyro,
  }
}
