import { StateCreator } from 'zustand'
import { MyStore } from '..'

type Position = {
  coord: [number, number, number]
  target: [number, number, number]
}

export interface CameraState {
  moving: boolean
  focus: CameraCoords
  position: Position
  cameraCoords: {
    default: Position
    pc: Position
    board: Position
    draw: Position
    cat: Position
  }
  setCamera: (pos: CameraCoords) => void
  setMoving: (moving: boolean) => void
}

export type CameraCoords = keyof CameraState['cameraCoords']

export const createCameraSlice: StateCreator<MyStore, [], [], CameraState> = (
  set,
  get,
) => ({
  moving: true,
  focus: 'default',
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
      coord: [0, 4, -3],
      target: [0, 4, -4],
    },
    board: {
      coord: [1.5, 6, 0.1],
      target: [3.3, 5.94, 0.12],
    },
    draw: {
      coord: [3.3, 5.1, 0],
      target: [4, 2, 0],
    },
    cat: {
      coord: [3.2, 9, -2.2],
      target: [4.75, 7.64, -5.6],
    },
  },
  setCamera: (pos) => {
    set((state) => ({
      position: state.cameraCoords[pos],
      moving: true,
      focus: pos,
    }))
    const { setLocation } = get()
    if (pos === 'cat' || pos === 'draw') setLocation(pos)
  },
  setMoving: (moving) => set({ moving }),
})
