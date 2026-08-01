import { StateCreator } from 'zustand'
import { MyStore } from '../../../store'
import { initialCameraState, transitionCamera } from './camera-model'
import type {
  CameraCoords,
  CameraModelState,
  CameraViewport,
} from './camera-types'

export interface CameraState extends CameraModelState {
  setCamera: (pos: CameraCoords) => void
  setHover: (pos: CameraCoords) => void
  setViewport: (viewport: CameraViewport) => void
}

export const createCameraSlice: StateCreator<MyStore, [], [], CameraState> = (
  set,
) => ({
  ...initialCameraState,
  setCamera: (pos) =>
    set((state) =>
      transitionCamera(state, { type: 'focusChanged', focus: pos }),
    ),
  setHover: (hover) =>
    set((state) => transitionCamera(state, { type: 'hoverChanged', hover })),
  setViewport: (viewport) =>
    set((state) =>
      transitionCamera(state, { type: 'viewportChanged', viewport }),
    ),
})

export type { CameraCoords } from './camera-types'
