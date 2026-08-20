import type { NavigationEvent, NavigationState } from './navigation-types'

type CatTransitionState = Pick<NavigationState, 'effect' | 'phase'>

export type CatAnimation = {
  scale: 0 | 2
  duration: number
  delay: number
  completionEvent: NavigationEvent['type'] | null
}

const segmentDuration = 4 / 3

const hiddenCat: CatAnimation = {
  scale: 0,
  duration: 0,
  delay: 0,
  completionEvent: null,
}

export function getCatAnimation(state: CatTransitionState): CatAnimation {
  if (state.effect !== 'cat') return hiddenCat

  if (state.phase === 'covering') {
    return {
      scale: 2,
      duration: segmentDuration,
      delay: 0,
      completionEvent: 'coverFinished',
    }
  }

  if (state.phase === 'covered') {
    return {
      scale: 2,
      duration: 0,
      delay: 0,
      completionEvent: null,
    }
  }

  if (state.phase === 'revealing') {
    return {
      scale: 0,
      duration: segmentDuration,
      delay: segmentDuration,
      completionEvent: 'revealFinished',
    }
  }

  return hiddenCat
}
