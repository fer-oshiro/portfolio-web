import { describe, expect, it } from 'vitest'

import { getBrushAnimation } from './brush-transition'
import {
  initialNavigationState,
  transitionNavigation,
} from './navigation-store'

describe('getBrushAnimation', () => {
  it('mantém o brush oculto quando ele não é o efeito ativo', () => {
    expect(getBrushAnimation(initialNavigationState)).toEqual({
      pathLength: 0,
      strokeWidth: 0,
      duration: 0,
      delay: 0,
      completionEvent: null,
    })

    const catCovering = transitionNavigation(initialNavigationState, {
      type: 'navigate',
      targetScene: 'cat',
      effect: 'cat',
    })

    expect(getBrushAnimation(catCovering).completionEvent).toBeNull()
  })

  it('cobre a cena e conclui com coverFinished', () => {
    const covering = transitionNavigation(initialNavigationState, {
      type: 'navigate',
      targetScene: 'draw',
      effect: 'brush',
    })

    expect(getBrushAnimation(covering)).toEqual({
      pathLength: 1,
      strokeWidth: 120,
      duration: 2,
      delay: 0,
      completionEvent: 'coverFinished',
    })
  })

  it('preserva a pausa visual antes de revelar e conclui com revealFinished', () => {
    const covering = transitionNavigation(initialNavigationState, {
      type: 'navigate',
      targetScene: 'draw',
      effect: 'brush',
    })
    const revealing = transitionNavigation(covering, {
      type: 'coverFinished',
    })

    expect(getBrushAnimation(revealing)).toEqual({
      pathLength: 0,
      strokeWidth: 0,
      duration: 2,
      delay: 2,
      completionEvent: 'revealFinished',
    })
  })
})
