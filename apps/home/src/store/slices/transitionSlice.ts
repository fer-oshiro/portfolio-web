import { StateCreator } from 'zustand'
import { MyStore } from '..'

export type Transition = 'none' | 'brush'

export interface TransitionState {
  transition: Transition
  setTransition: (transition: Transition) => void
}

export const createTransitionSlice: StateCreator<
  MyStore,
  [],
  [],
  TransitionState
> = (set) => ({
  transition: 'none',
  setTransition: (transition) => set({ transition }),
})
