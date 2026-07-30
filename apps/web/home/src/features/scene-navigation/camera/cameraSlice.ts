import { StateCreator } from 'zustand'
import { MyStore } from '../../../store'

type Position = {
  coord: [number, number, number]
  target: [number, number, number]
}

export interface CameraState {
  moving: boolean
  mobile: boolean
  hover: CameraCoords
  focus: CameraCoords
  position: Position
  cameraCoords: {
    default: Position
    pc: Position
    board: Position
    draw: Position
    cat: Position
  }
  cameraCoordsMobile: {
    default: Position
    pc: Position
    board: Position
    draw: Position
    cat: Position
  }
  setCamera: (pos: CameraCoords) => void
  setMoving: (moving: boolean) => void
  setHover: (pos: CameraCoords) => void
  setMobile: (mobile: boolean) => void
}

export type CameraCoords = keyof CameraState['cameraCoords']

export const createCameraSlice: StateCreator<MyStore, [], [], CameraState> = (
  set,
  get,
) => ({
  mobile: true,
  moving: true,
  focus: 'default',
  hover: 'default',
  position: {
    coord: [-13.5, 50.5, 7.5],
    target: [0.75, -0.5, -0.3],
  },
  cameraCoords: {
    default: {
      coord: [-4.1, 8.5, 2.7],
      target: [3.3, 4.66, -1.5],
    },
    pc: {
      coord: [0, 4.03, -2.34],
      target: [0, 3.95, -4],
    },
    board: {
      coord: [2.19, 6.27, 0.6],
      target: [6.1, 6.3, 0.5],
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
  cameraCoordsMobile: {
    default: {
      coord: [-9.3, 8.6, 5.3],
      target: [2.61, 3.58, -1.63],
    },
    pc: {
      coord: [0, 4.5, -0.1],
      target: [0.03, 4.16, -2.03],
    },
    board: {
      coord: [-0.9, 6.6, 0.6],
      target: [3.14, 6.28, 0.39],
    },
    draw: {
      coord: [1.6, 5.1, 1.1],
      target: [3.25, 3.63, 1],
    },
    cat: {
      coord: [1.3, 9.6, -2.2],
      target: [3.61, 8.58, -3.54],
    },
  },
  setCamera: (pos) => {
    const {
      setLocation,
      setHover,
      setTransition,
      mobile,
      cameraCoords,
      cameraCoordsMobile,
    } = get()
    const coords = mobile ? cameraCoordsMobile : cameraCoords

    set({
      position: coords[pos],
      moving: true,
      focus: pos,
    })

    setHover('default')
    if (pos === 'cat' || pos === 'draw') {
      if (pos === 'cat') setTransition('cat')
      if (pos === 'draw') setTransition('brush')
      setLocation(pos)
    }
  },
  setMoving: (moving) => set({ moving }),
  setHover: (hover) => set({ hover }),
  setMobile: (mobile) => set({ mobile }),
})
