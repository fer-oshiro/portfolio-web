import type { GyroscopeData } from '@fer-oshiro/realtime-contract'
import { useCallback, useRef } from 'react'

import type { CursorPosition } from '../remote-control-store'

const BASE_WIDTH = 1920
const BASE_HEIGHT = 1080
const BASE_RANGE_X = 40
const BASE_RANGE_Y = 20

type Viewport = {
  width: number
  height: number
}

type GyroOffset = {
  alpha: number
  beta: number
}

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value))

export const mapGyroToScreen = (
  gyro: Pick<GyroscopeData, 'alpha' | 'beta'>,
  viewport: Viewport,
  offset: GyroOffset = { alpha: 0, beta: 15 },
): CursorPosition => {
  const rangeX = BASE_RANGE_X * (viewport.width / BASE_WIDTH)
  const rangeY = BASE_RANGE_Y * (viewport.height / BASE_HEIGHT)
  let normalizedAlpha = gyro.alpha - offset.alpha
  if (normalizedAlpha > 180) normalizedAlpha -= 360
  if (normalizedAlpha < -180) normalizedAlpha += 360
  const finalAlpha = -normalizedAlpha
  const diffBeta = gyro.beta - offset.beta

  return {
    x:
      ((clamp(finalAlpha, -rangeX, rangeX) + rangeX) / (2 * rangeX)) *
      viewport.width,
    y:
      ((clamp(-diffBeta, -rangeY, rangeY) + rangeY) / (2 * rangeY)) *
      viewport.height,
  }
}

export const useGyro = (onPosition: (position: CursorPosition) => void) => {
  const offset = useRef<GyroOffset | null>(null)

  const calibrate = useCallback((currentAlpha: number, currentBeta: number) => {
    offset.current = { alpha: currentAlpha, beta: currentBeta }
  }, [])

  const resetCalibration = useCallback(() => {
    offset.current = null
  }, [])

  const handleGyro = useCallback(
    (gyro: GyroscopeData) => {
      if (!offset.current) {
        offset.current = { alpha: gyro.alpha, beta: gyro.beta }
      }

      onPosition(
        mapGyroToScreen(
          gyro,
          { width: window.innerWidth, height: window.innerHeight },
          offset.current,
        ),
      )
    },
    [onPosition],
  )

  return { calibrate, handleGyro, resetCalibration }
}
