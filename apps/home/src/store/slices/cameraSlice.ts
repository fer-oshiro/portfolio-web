import { StateCreator } from 'zustand'
import { MyStore } from '..'

type Position = {
  coord: [number, number, number]
  target: [number, number, number]
}

export interface CameraState {
  moving: boolean
  position: Position
  cameraCoords: {
    default: Position
    pc: Position
    board: Position
  }
  setCamera: (pos: CameraCoords) => void
  setMoving: (moving: boolean) => void
}

type CameraCoords = keyof CameraState['cameraCoords']

export const createCameraSlice: StateCreator<MyStore, [], [], CameraState> = (
  set,
) => ({
  moving: true,
  position: {
    coord: [-13.5, 50.5, 7.5],
    target: [0.75, -0.5, -0.3],
  },
  cameraCoords: {
    default: {
      coord: [-13.5, 12.5, 7.5],
      target: [0, 0, 0],
    },
    pc: {
      coord: [0, 4, -1.5],
      target: [0, 4, -2.5],
    },
    board: {
      coord: [1.5, 6, 0.1],
      target: [3.3, 5.94, 0.12],
    },
  },
  setCamera: (pos) =>
    set((state) => ({ position: state.cameraCoords[pos], moving: true })),
  setMoving: (moving) => set({ moving }),
})
