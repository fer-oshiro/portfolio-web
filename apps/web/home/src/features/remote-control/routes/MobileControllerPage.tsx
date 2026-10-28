import type { GyroscopeData } from '@fer-oshiro/realtime-contract'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useSearchParams } from 'react-router'

import { useMobileRTC } from '../hooks/use-mobile-rtc'

import './MobileControllerPage.css'

type DeviceOrientationConstructor = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'denied' | 'granted'>
}

type GyroControlsProps = {
  getGyroSnapshot: () => GyroscopeData
  handleSendGyro: (input: {
    alpha: number | null
    beta: number | null
    gamma: number | null
  }) => void
  subscribeGyro: (listener: () => void) => () => void
}

const GyroControls = ({
  getGyroSnapshot,
  handleSendGyro,
  subscribeGyro,
}: GyroControlsProps) => {
  const gyro = useSyncExternalStore(
    subscribeGyro,
    getGyroSnapshot,
    getGyroSnapshot,
  )

  const handleFakeInput = (input: Partial<GyroscopeData>) => {
    handleSendGyro({ ...gyro, ...input })
  }

  return (
    <>
      <p className="mobile-controller__gyro-data">{JSON.stringify(gyro)}</p>

      <div>
        <input
          type="range"
          id="alpha"
          name="alpha"
          min="0"
          max="360"
          value={gyro.alpha}
          onChange={(e) => handleFakeInput({ alpha: Number(e.target.value) })}
        />
        <label htmlFor="alpha">alpha</label>
      </div>

      <div>
        <input
          type="range"
          id="beta"
          name="beta"
          min="-30"
          max="60"
          value={gyro.beta}
          onChange={(e) => handleFakeInput({ beta: Number(e.target.value) })}
        />
        <label htmlFor="beta">beta</label>
      </div>

      <div>
        <input
          type="range"
          id="gamma"
          name="gamma"
          min="-90"
          max="90"
          value={gyro.gamma}
          onChange={(e) => handleFakeInput({ gamma: Number(e.target.value) })}
        />
        <label htmlFor="gamma">gamma</label>
      </div>
    </>
  )
}

export const Mobile = () => {
  const [searchParams] = useSearchParams()
  const [msg1, setMsg] = useState<string[]>([])
  const [gyroStatus, setGyroStatus] = useState('idle')
  const lastSend = useRef(0)
  const orientationListener = useRef<
    ((event: DeviceOrientationEvent) => void) | null
  >(null)
  const {
    connected,
    getGyroSnapshot,
    handleSendGyro,
    readyState,
    subscribeGyro,
  } = useMobileRTC(
    (log) => setMsg((prev) => [...prev, log]),
    searchParams.get('roomId') ?? 'error',
  )
  const wakeLock = useRef<WakeLockSentinel | null>(null)

  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLock.current = await navigator.wakeLock.request('screen')
        console.log('✅ Tela bloqueada (não vai hibernar)')

        wakeLock.current.addEventListener('release', () => {
          console.log('Wake Lock liberado')
        })
      }
    } catch (error: unknown) {
      console.error(error instanceof Error ? error.message : String(error))
    }
  }

  const startGyroscope = () => {
    setGyroStatus('startGyroscope')
    if (orientationListener.current) {
      window.removeEventListener(
        'deviceorientation',
        orientationListener.current,
      )
    }

    const handleMotion = (event: DeviceOrientationEvent) => {
      const now = Date.now()
      if (now - lastSend.current < 60) return
      lastSend.current = now
      handleSendGyro({
        alpha: event.alpha,
        beta: event.beta,
        gamma: event.gamma,
      })
    }
    orientationListener.current = handleMotion
    window.addEventListener('deviceorientation', handleMotion)
  }

  const requestPermission = async () => {
    setGyroStatus('ask permission')
    const requestOrientationPermission = (
      DeviceOrientationEvent as DeviceOrientationConstructor
    ).requestPermission
    if (typeof requestOrientationPermission === 'function') {
      try {
        const permission = await requestOrientationPermission()
        setGyroStatus(permission)
        if (permission === 'granted') startGyroscope()
      } catch (error: unknown) {
        setGyroStatus('Permissão Negada')
        setMsg((prev) => [
          ...prev,
          `Error: ${error instanceof Error ? error.message : String(error)}`,
        ])
      }
      await requestWakeLock()
    } else {
      startGyroscope()
    }
  }

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (wakeLock.current !== null && document.visibilityState === 'visible') {
        await requestWakeLock()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (orientationListener.current) {
        window.removeEventListener(
          'deviceorientation',
          orientationListener.current,
        )
        orientationListener.current = null
      }
      void wakeLock.current?.release()
      wakeLock.current = null
    }
  }, [])

  return (
    <div className="mobile-controller">
      <h2>Controle Mobile</h2>
      <p>Status: {connected}</p>
      <p>{readyState}</p>

      <button
        onClick={requestPermission}
        className="mobile-controller__activate"
      >
        Ativar Giroscópio
      </button>

      <p className="mobile-controller__gyro-status">{gyroStatus}</p>
      <p>
        DeviceOrientationEvent: {JSON.stringify(window.DeviceOrientationEvent)}
      </p>
      <p className="mobile-controller__logs">{JSON.stringify(msg1)}</p>

      <GyroControls
        getGyroSnapshot={getGyroSnapshot}
        handleSendGyro={handleSendGyro}
        subscribeGyro={subscribeGyro}
      />
    </div>
  )
}
