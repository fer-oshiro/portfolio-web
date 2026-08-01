import { createStore } from 'zustand/vanilla'

import { initialCameraState, transitionCamera } from './camera-model'
import type {
  CameraCoords,
  CameraModelState,
  CameraViewport,
} from './camera-types'

export interface CameraStore extends CameraModelState {
  setCamera: (focus: CameraCoords) => void
  setHover: (hover: CameraCoords) => void
  setViewport: (viewport: CameraViewport) => void
}

export const createCameraStore = () =>
  createStore<CameraStore>()((set) => ({
    ...initialCameraState,
    setCamera: (focus) =>
      set((state) => transitionCamera(state, { type: 'focusChanged', focus })),
    setHover: (hover) =>
      set((state) => transitionCamera(state, { type: 'hoverChanged', hover })),
    setViewport: (viewport) =>
      set((state) =>
        transitionCamera(state, { type: 'viewportChanged', viewport }),
      ),
  }))

export const cameraStore = createCameraStore()
