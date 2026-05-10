import { useState } from 'react'

import { Cursor } from '../components/Cursor/Cursor'
import { QRCode } from '../components/QRCode'
import { useDesktopRTC } from '../hooks/useDesktopRTC'

const BASE_WIDTH = 1920
const BASE_HEIGHT = 1080
const BASE_RANGE_X = 60
const BASE_RANGE_Y = 30

export const Desktop = () => {
  const { connected, gyro, roomId } = useDesktopRTC()
  const [offset, setOffset] = useState({ alpha: 180, beta: 35 })

  const calibrate = (currentAlpha: number, currentBeta: number) => {
    setOffset({ alpha: currentAlpha, beta: currentBeta })
  }

  const mapGyroToScreen = (alpha: number, beta: number) => {
    const W = window.innerWidth
    const H = window.innerHeight

    const RANGE_X = BASE_RANGE_X * (W / BASE_WIDTH)
    const RANGE_Y = BASE_RANGE_Y * (H / BASE_HEIGHT)

    const clamp = (v: number, min: number, max: number) =>
      Math.max(min, Math.min(max, v))

    let diffAlpha = alpha > 180 ? alpha - 360 : alpha
    const finalAlpha = -diffAlpha

    const diffBeta = beta - offset.beta

    const x =
      ((clamp(finalAlpha, -RANGE_X, RANGE_X) + RANGE_X) / (2 * RANGE_X)) * W

    const y =
      ((clamp(-diffBeta, -RANGE_Y, RANGE_Y) + RANGE_Y) / (2 * RANGE_Y)) * H

    return { x, y }
  }

  const { x, y } = mapGyroToScreen(gyro.alpha, gyro.beta)

  return (
    <div style={{ padding: 20 }}>
      <h2>Desktop (WebRTC)</h2>
      <p>
        Status:{' '}
        {connected === 'connected'
          ? '🟢 P2P Conectado'
          : '🔴 Aguardando mobile...'}
      </p>
      {connected === 'connected' && (
        <div
          style={{ fontSize: '1.5rem', padding: 20, border: '1px solid white' }}
        >
          <p>Alpha: {gyro.alpha?.toFixed(2)}°</p>
          <p>Beta: {gyro.beta?.toFixed(2)}°</p>
          <p>Gamma: {gyro.gamma?.toFixed(2)}°</p>
        </div>
      )}
      {connected !== 'connected' && <QRCode roomId={roomId} />}
      <div>
        <p>{x?.toFixed(2)}</p>
        <p>{y?.toFixed(2)}</p>
      </div>
      {connected === 'connected' && <Cursor x={`${x}px`} y={`${y}px`} />}
      <button onClick={() => calibrate(gyro.alpha, gyro.beta)}>
        Centralizar Cursor
      </button>
    </div>
  )
}
