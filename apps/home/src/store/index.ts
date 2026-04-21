import { create } from 'zustand'
import { CameraState, createCameraSlice } from './slices/cameraSlice'
import {
  createTransitionSlice,
  TransitionState,
} from './slices/transitionSlice'

export type MyStore = CameraState & TransitionState

export const useStore = create<MyStore>((...a) => ({
  ...createCameraSlice(...a),
  ...createTransitionSlice(...a),
}))
