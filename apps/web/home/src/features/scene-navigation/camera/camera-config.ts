import type { CameraFocus, CameraPose, CameraViewport } from './camera-types'

type CameraConfig = Record<CameraViewport, Record<CameraFocus, CameraPose>>

export const cameraConfig = {
  desktop: {
    intro: {
      coord: [-13.5, 50.5, 7.5],
      target: [0.75, -0.5, -0.3],
    },
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
  mobile: {
    intro: {
      coord: [-13.5, 50.5, 7.5],
      target: [0.75, -0.5, -0.3],
    },
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
} as const satisfies CameraConfig
