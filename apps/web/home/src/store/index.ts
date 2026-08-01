import { create } from 'zustand'
import {
  CameraState,
  createCameraSlice,
} from '../features/scene-navigation/camera/cameraSlice'
import { createTrickedSlice, TrickedState } from './slices/trickedSlice'
import { createLoadingSlice, LoadingState } from './slices/loadingSlice'
import { createGyroSlice, GyroState } from './slices/gyroSlice'

export type MyStore = CameraState & TrickedState & LoadingState & GyroState

export const useStore = create<MyStore>((...a) => ({
  ...createCameraSlice(...a),
  ...createTrickedSlice(...a),
  ...createLoadingSlice(...a),
  ...createGyroSlice(...a),
}))
