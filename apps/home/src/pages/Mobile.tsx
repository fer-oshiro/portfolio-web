import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'

import { useMobileRTC } from '../hooks/useMobileRTC'

let lastSend = 0

export const Mobile = () => {
  const [searchParams] = useSearchParams()
  const [msg1, setMsg] = useState<string[]>([])
  const [gyroStatus, setGyroStatus] = useState('idle')
  const { connected, gyro, handleSendGyro, readyState } = useMobileRTC(
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
    } catch (err: any) {
      console.error(`${err.name}, ${err.message}`)
    }
  }

  const startGyroscope = () => {
    setGyroStatus('startGyroscope')
    const handleMotion = (event: DeviceOrientationEvent) => {
      const now = Date.now()
      if (now - lastSend < 32) return
      lastSend = now
      handleSendGyro({
        alpha: event.alpha,
        beta: event.beta,
        gamma: event.gamma,
      })
    }
    window.addEventListener('deviceorientation', handleMotion)
  }

  const requestPermission = async () => {
    setGyroStatus('ask permission')
    if (
      typeof (DeviceOrientationEvent as any).requestPermission === 'function'
    ) {
      try {
        const permission = await (
          DeviceOrientationEvent as any
        ).requestPermission()
        setGyroStatus(permission)
        if (permission === 'granted') startGyroscope()
      } catch (e: any) {
        setGyroStatus('Permissão Negada')
        setMsg((prev) => [
          ...prev,
          `Error: ${e?.message || e?.name || String(e)}`,
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
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const handleFakeInput = (input: {
    alpha?: number
    beta?: number
    gamma?: number
  }) => {
    const payload = { ...gyro, ...input }
    handleSendGyro(payload)
  }

  return (
    <div style={{ padding: 20, textAlign: 'center' }}>
      <h2>Controle Mobile</h2>
      <p>Status: {connected}</p>
      <p>{readyState}</p>

      <button
        onClick={requestPermission}
        style={{ padding: '15px 30px', fontSize: 18 }}
      >
        Ativar Giroscópio
      </button>

      <p style={{ paddingTop: '20px' }}>{gyroStatus}</p>
      <p style={{ padding: '30px' }}>{JSON.stringify(gyro)}</p>
      <p>
        DeviceOrientationEvent: {JSON.stringify(window.DeviceOrientationEvent)}
      </p>
      <p>{JSON.stringify(msg1)}</p>

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
          min="-180"
          max="180"
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
    </div>
  )
}
