import type { GyroscopeData } from '@fer-oshiro/realtime-contract'
import { useCallback, useRef } from 'react'

import type { CursorPosition } from '../remote-control-store'

const PITCH_BOTTOM = -10
const PITCH_TOP = 30
const YAW_RANGE = 45

type Viewport = {
  width: number
  height: number
}

type PointerAngles = {
  yaw: number
  pitch: number
}

const DEG = Math.PI / 180

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value))

const wrap180 = (angle: number) => {
  const wrapped = (((angle + 180) % 360) + 360) % 360
  return wrapped - 180
}

// Direction of the device Y axis (top edge) in world space, from the W3C
// Rz(alpha)·Rx(beta)·Ry(gamma) rotation. It ignores gamma, so the Euler flip
// when the phone rolls past 90° (beta → 180 - beta, alpha → alpha + 180)
// yields the same pointer
export const getPointerAngles = (
  gyro: Pick<GyroscopeData, 'alpha' | 'beta'>,
): PointerAngles => {
  const alpha = gyro.alpha * DEG
  const beta = gyro.beta * DEG
  const east = -Math.sin(alpha) * Math.cos(beta)
  const north = Math.cos(alpha) * Math.cos(beta)

  return {
    yaw: Math.atan2(east, north) / DEG,
    pitch: Math.asin(clamp(Math.sin(beta), -1, 1)) / DEG,
  }
}

export const mapGyroToScreen = (
  gyro: Pick<GyroscopeData, 'alpha' | 'beta'>,
  viewport: Viewport,
  yawCenter = 0,
): { position: CursorPosition; yawCenter: number } => {
  const { yaw, pitch } = getPointerAngles(gyro)
  const delta = wrap180(yaw - yawCenter)
  const clampedDelta = clamp(delta, -YAW_RANGE, YAW_RANGE)
  const nextYawCenter = wrap180(yawCenter + delta - clampedDelta)

  return {
    position: {
      x: ((clampedDelta + YAW_RANGE) / (2 * YAW_RANGE)) * viewport.width,
      y:
        clamp((PITCH_TOP - pitch) / (PITCH_TOP - PITCH_BOTTOM), 0, 1) *
        viewport.height,
    },
    yawCenter: nextYawCenter,
  }
}

export const useGyro = (onPosition: (position: CursorPosition) => void) => {
  const yawCenter = useRef<number | null>(null)

  const resetCalibration = useCallback(() => {
    yawCenter.current = null
  }, [])

  const handleGyro = useCallback(
    (gyro: GyroscopeData) => {
      yawCenter.current ??= getPointerAngles(gyro).yaw

      const result = mapGyroToScreen(
        gyro,
        { width: window.innerWidth, height: window.innerHeight },
        yawCenter.current,
      )
      yawCenter.current = result.yawCenter
      onPosition(result.position)
    },
    [onPosition],
  )

  return { handleGyro, resetCalibration }
}
