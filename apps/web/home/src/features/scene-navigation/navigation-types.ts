export type Scene = 'room' | 'draw' | 'cat'

export type TransitionEffect = 'none' | 'brush' | 'cat'
export type ActiveTransitionEffect = Exclude<TransitionEffect, 'none'>
export type TransitionPhase = 'idle' | 'covering' | 'revealing'

type IdleNavigationState = {
  currentScene: Scene
  targetScene: null
  phase: 'idle'
  effect: 'none'
}

type CoveringNavigationState = {
  currentScene: Scene
  targetScene: Scene
  phase: 'covering'
  effect: ActiveTransitionEffect
}

type RevealingNavigationState = {
  currentScene: Scene
  targetScene: null
  phase: 'revealing'
  effect: ActiveTransitionEffect
}

export type NavigationState =
  IdleNavigationState | CoveringNavigationState | RevealingNavigationState

export type NavigationEvent =
  | {
      type: 'navigate'
      targetScene: Scene
      effect: ActiveTransitionEffect
    }
  | { type: 'coverFinished' }
  | { type: 'revealFinished' }
  | { type: 'cancelNavigation' }

export type NavigationActions = {
  navigate: (targetScene: Scene, effect: ActiveTransitionEffect) => void
  coverFinished: () => void
  revealFinished: () => void
  cancelNavigation: () => void
}

export type NavigationStore = NavigationState & NavigationActions
