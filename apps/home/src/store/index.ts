import { create } from 'zustand'
import { CameraState, createCameraSlice } from './slices/cameraSlice'

export type MyStore = CameraState

export const useStore = create<MyStore>((...a) => ({
  ...createCameraSlice(...a),
}))
