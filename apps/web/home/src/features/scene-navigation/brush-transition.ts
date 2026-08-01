import type { NavigationEvent, NavigationState } from './navigation-types'

type BrushTransitionState = Pick<NavigationState, 'effect' | 'phase'>

export type BrushAnimation = {
  pathLength: 0 | 1
  strokeWidth: 0 | 120
  duration: number
  delay: number
  completionEvent: NavigationEvent['type'] | null
}

const hiddenBrush: BrushAnimation = {
  pathLength: 0,
  strokeWidth: 0,
  duration: 0,
  delay: 0,
  completionEvent: null,
}

export function getBrushAnimation(state: BrushTransitionState): BrushAnimation {
  if (state.effect !== 'brush') return hiddenBrush

  if (state.phase === 'covering') {
    return {
      pathLength: 1,
      strokeWidth: 120,
      duration: 2,
      delay: 0,
      completionEvent: 'coverFinished',
    }
  }

  return {
    pathLength: 0,
    strokeWidth: 0,
    duration: 2,
    delay: 2,
    completionEvent: 'revealFinished',
  }
}
