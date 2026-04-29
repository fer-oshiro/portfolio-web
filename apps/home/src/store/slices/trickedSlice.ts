import { StateCreator } from 'zustand'
import { MyStore } from '..'

export interface TrickedState {
  tricked: boolean
  opts: {}
  setTricked: (tricked: boolean) => void
}

export const createTrickedSlice: StateCreator<MyStore, [], [], TrickedState> = (
  set,
) => ({
  tricked: false,
  opts: {
    height: '390',
    width: '640',
    playerVars: {
      autoplay: 1,
      controls: 1,
    },
  },
  setTricked: (tricked) => set({ tricked }),
})
