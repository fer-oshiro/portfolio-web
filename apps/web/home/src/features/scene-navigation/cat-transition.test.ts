import { describe, expect, it } from 'vitest'

import { getCatAnimation } from './cat-transition'
import {
  initialNavigationState,
  transitionNavigation,
} from './navigation-store'

describe('getCatAnimation', () => {
  it('mantém o cat oculto quando ele não é o efeito ativo', () => {
    expect(getCatAnimation(initialNavigationState)).toEqual({
      scale: 0,
      duration: 0,
      delay: 0,
      completionEvent: null,
    })

    const brushCovering = transitionNavigation(initialNavigationState, {
      type: 'navigate',
      targetScene: 'draw',
      effect: 'brush',
    })

    expect(getCatAnimation(brushCovering).completionEvent).toBeNull()
  })

  it('cobre a cena e conclui com coverFinished', () => {
    const covering = transitionNavigation(initialNavigationState, {
      type: 'navigate',
      targetScene: 'cat',
      effect: 'cat',
    })

    expect(getCatAnimation(covering)).toEqual({
      scale: 2,
      duration: 4 / 3,
      delay: 0,
      completionEvent: 'coverFinished',
    })
  })

  it('preserva a pausa coberta antes de revelar e conclui com revealFinished', () => {
    const covering = transitionNavigation(initialNavigationState, {
      type: 'navigate',
      targetScene: 'cat',
      effect: 'cat',
    })
    const revealing = transitionNavigation(covering, {
      type: 'coverFinished',
    })

    expect(getCatAnimation(revealing)).toEqual({
      scale: 0,
      duration: 4 / 3,
      delay: 4 / 3,
      completionEvent: 'revealFinished',
    })
  })
})
