import { create } from 'zustand'
import { CameraState, createCameraSlice } from './slices/cameraSlice'
import { createLocationSlice, LocationState } from './slices/locationSlice'
import {
  createTransitionSlice,
  TransitionState,
} from './slices/transitionSlice'
import { createTrickedSlice, TrickedState } from './slices/trickedSlice'
import { createLoadingSlice, LoadingState } from './slices/loadingSlice'
import { createGyroSlice, GyroState } from './slices/gyroSlice'

export type MyStore = CameraState &
  TransitionState &
  TrickedState &
  LocationState &
  LoadingState &
  GyroState

export const useStore = create<MyStore>((...a) => ({
  ...createCameraSlice(...a),
  ...createTransitionSlice(...a),
  ...createTrickedSlice(...a),
  ...createLocationSlice(...a),
  ...createLoadingSlice(...a),
  ...createGyroSlice(...a),
}))
