import { create } from 'zustand'
import {
  CameraState,
  createCameraSlice,
} from '../features/scene-navigation/camera/cameraSlice'
import {
  createLocationSlice,
  LocationState,
} from '../features/scene-navigation/locationSlice'
import {
  createTransitionSlice,
  TransitionState,
} from '../features/scene-navigation/transitionSlice'
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
