import { createStore } from 'zustand/vanilla'

import type {
  NavigationEvent,
  NavigationState,
  NavigationStore,
} from './navigation-types'

export const initialNavigationState: NavigationState = {
  currentScene: 'room',
  targetScene: null,
  phase: 'idle',
  effect: 'none',
}

export function transitionNavigation(
  state: NavigationState,
  event: NavigationEvent,
): NavigationState {
  switch (event.type) {
    case 'navigate':
      if (state.phase !== 'idle' || event.targetScene === state.currentScene) {
        return state
      }

      return {
        currentScene: state.currentScene,
        targetScene: event.targetScene,
        phase: 'covering',
        effect: event.effect,
      }

    case 'coverFinished':
      if (state.phase !== 'covering') return state

      return {
        currentScene: state.targetScene,
        targetScene: null,
        phase: 'revealing',
        effect: state.effect,
      }

    case 'revealFinished':
      if (state.phase !== 'revealing') return state

      return {
        currentScene: state.currentScene,
        targetScene: null,
        phase: 'idle',
        effect: 'none',
      }

    case 'cancelNavigation':
      if (state.phase === 'idle') return state

      return {
        currentScene: state.currentScene,
        targetScene: null,
        phase: 'idle',
        effect: 'none',
      }
  }
}

export const createNavigationStore = () =>
  createStore<NavigationStore>()((set) => ({
    ...initialNavigationState,
    navigate: (targetScene, effect) =>
      set((state) =>
        transitionNavigation(state, {
          type: 'navigate',
          targetScene,
          effect,
        }),
      ),
    coverFinished: () =>
      set((state) => transitionNavigation(state, { type: 'coverFinished' })),
    revealFinished: () =>
      set((state) => transitionNavigation(state, { type: 'revealFinished' })),
    cancelNavigation: () =>
      set((state) => transitionNavigation(state, { type: 'cancelNavigation' })),
  }))

export const navigationStore = createNavigationStore()
