import { useEffect, useState } from 'react'

const BASE_WIDTH = 1920
const BASE_HEIGHT = 1080
const BASE_RANGE_X = 40
const BASE_RANGE_Y = 20

export const useGyro = (gyro: { alpha?: number; beta?: number }) => {
  const [offset, setOffset] = useState({ alpha: 180, beta: 15 })
  const [position, setPosition] = useState({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  })

  const calibrate = (currentAlpha: number, currentBeta: number) => {
    setOffset({ alpha: currentAlpha, beta: currentBeta })
  }

  const mapGyroToScreen = (alpha?: number, beta?: number) => {
    if (!alpha || !beta) return position

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

    setPosition({ x, y })
  }

  useEffect(() => {
    mapGyroToScreen(gyro.alpha, gyro.beta)
  }, [gyro])

  console.log({
    gyro,
    position,
  })
  return { ...position, calibrate }
}
