import { StateCreator } from 'zustand'
import { MyStore } from '..'

type Gyro = {
  alpha: number
  beta: number
  gamma: number
}

export interface GyroState {
  connected: boolean
  gyro: Gyro
  cursorPosition: { x: number; y: number }
  setGyro: (gyro: Gyro) => void
  setConnected: (connected: boolean) => void
  setCursorPosition: (position: { x: number; y: number }) => void
}

export const createGyroSlice: StateCreator<MyStore, [], [], GyroState> = (
  set,
) => ({
  connected: false,
  gyro: {
    alpha: 0,
    beta: 0,
    gamma: 0,
  },
  cursorPosition: { x: 0, y: 0 },
  setGyro: (gyro) => set({ gyro }),
  setConnected: (connected) => set({ connected }),
  setCursorPosition: (cursorPosition) => set({ cursorPosition }),
})
