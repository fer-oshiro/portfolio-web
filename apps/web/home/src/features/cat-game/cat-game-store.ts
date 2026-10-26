import { createStore } from 'zustand/vanilla'

import type { MusicStatus } from './audio/cat-audio-controller'

// Domain data that outlives the overlay. Audio objects stay in the
// controller; the current minigame has no score or phase yet.
type CatGameState = {
  effectsVolume: number
  musicStatus: MusicStatus
}

type CatGameActions = {
  setMusicStatus: (musicStatus: MusicStatus) => void
}

export type CatGameStore = CatGameState & CatGameActions

export const createCatGameStore = () =>
  createStore<CatGameStore>()((set) => ({
    effectsVolume: 0.7,
    musicStatus: 'stopped',
    setMusicStatus: (musicStatus) => set({ musicStatus }),
  }))

export const catGameStore = createCatGameStore()
