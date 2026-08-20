export type Scene = 'room' | 'draw' | 'cat'

export type TransitionEffect = 'none' | 'brush' | 'cat'
export type ActiveTransitionEffect = Exclude<TransitionEffect, 'none'>
export type TransitionPhase = 'idle' | 'covering' | 'covered' | 'revealing'
export type TargetStatus = 'loading' | 'ready' | 'failed'

type IdleNavigationState = {
  currentScene: Scene
  targetScene: null
  phase: 'idle'
  effect: 'none'
}

type LoadingNavigationState = {
  currentScene: Scene
  targetScene: Scene
  phase: 'covering' | 'covered'
  effect: ActiveTransitionEffect
  targetStatus: 'loading'
}

type SettledNavigationState = {
  currentScene: Scene
  targetScene: Scene
  phase: 'covering'
  effect: ActiveTransitionEffect
  targetStatus: Exclude<TargetStatus, 'loading'>
}

type RevealingNavigationState = {
  currentScene: Scene
  targetScene: null
  phase: 'revealing'
  effect: ActiveTransitionEffect
}

export type NavigationState =
  | IdleNavigationState
  | LoadingNavigationState
  | SettledNavigationState
  | RevealingNavigationState

export type NavigationEvent =
  | {
      type: 'navigate'
      targetScene: Scene
      effect: ActiveTransitionEffect
    }
  | { type: 'sceneReady'; scene: Scene }
  | { type: 'sceneFailed'; scene: Scene; reason: string }
  | { type: 'coverFinished' }
  | { type: 'revealFinished' }
  | { type: 'cancelNavigation' }

export type NavigationActions = {
  navigate: (targetScene: Scene, effect: ActiveTransitionEffect) => void
  sceneReady: (scene: Scene) => void
  sceneFailed: (scene: Scene, reason: string) => void
  coverFinished: () => void
  revealFinished: () => void
  cancelNavigation: () => void
}

export type NavigationStore = NavigationState & NavigationActions
