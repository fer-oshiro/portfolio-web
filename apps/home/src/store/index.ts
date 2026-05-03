import { create } from 'zustand'
import { CameraState, createCameraSlice } from './slices/cameraSlice'
import { createLocationSlice, LocationState } from './slices/locationSlice'
import {
  createTransitionSlice,
  TransitionState,
} from './slices/transitionSlice'
import { createTrickedSlice, TrickedState } from './slices/trickedSlice'

export type MyStore = CameraState &
  TransitionState &
  TrickedState &
  LocationState

export const useStore = create<MyStore>((...a) => ({
  ...createCameraSlice(...a),
  ...createTransitionSlice(...a),
  ...createTrickedSlice(...a),
  ...createLocationSlice(...a),
}))
