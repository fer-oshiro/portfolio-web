import { StateCreator } from 'zustand'
import { MyStore } from '../../store'

export type Transition = 'none' | 'brush' | 'cat'

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
