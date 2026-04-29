import { create } from 'zustand'
import { CameraState, createCameraSlice } from './slices/cameraSlice'
import {
  createTransitionSlice,
  TransitionState,
} from './slices/transitionSlice'
import { createTrickedSlice, TrickedState } from './slices/trickedSlice'

export type MyStore = CameraState & TransitionState & TrickedState

export const useStore = create<MyStore>((...a) => ({
  ...createCameraSlice(...a),
  ...createTransitionSlice(...a),
  ...createTrickedSlice(...a),
}))
