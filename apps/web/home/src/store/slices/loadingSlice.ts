import { StateCreator } from 'zustand'
import { MyStore } from '..'

type Status = 'idle' | 'connecting' | 'loading' | 'ready' | 'server_error'

export interface LoadingState {
  status: Status
  setStatus: (status: Status) => void
}

export const createLoadingSlice: StateCreator<MyStore, [], [], LoadingState> = (
  set,
) => ({
  status: 'idle',
  setStatus: (status) => set({ status }),
})
