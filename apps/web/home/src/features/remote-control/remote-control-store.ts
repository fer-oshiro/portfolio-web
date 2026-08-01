import { createStore } from 'zustand/vanilla'

export type RemoteControlStatus = 'idle' | 'server_error'

export type CursorPosition = {
  x: number
  y: number
}

export interface RemoteControlStore {
  connected: boolean
  cursorPosition: CursorPosition
  status: RemoteControlStatus
  setConnected: (connected: boolean) => void
  setCursorPosition: (cursorPosition: CursorPosition) => void
  setStatus: (status: RemoteControlStatus) => void
}

export const createRemoteControlStore = () =>
  createStore<RemoteControlStore>()((set) => ({
    connected: false,
    cursorPosition: { x: 0, y: 0 },
    status: 'idle',
    setConnected: (connected) => set({ connected }),
    setCursorPosition: (cursorPosition) => set({ cursorPosition }),
    setStatus: (status) => set({ status }),
  }))

export const remoteControlStore = createRemoteControlStore()
