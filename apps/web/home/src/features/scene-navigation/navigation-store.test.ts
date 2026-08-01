import { describe, expect, it, vi } from 'vitest'

import {
  createNavigationStore,
  initialNavigationState,
  transitionNavigation,
} from './navigation-store'
import type {
  ActiveTransitionEffect,
  NavigationState,
  Scene,
} from './navigation-types'

function completeNavigation(
  state: NavigationState,
  targetScene: Scene,
  effect: ActiveTransitionEffect,
) {
  const covering = transitionNavigation(state, {
    type: 'navigate',
    targetScene,
    effect,
  })
  const revealing = transitionNavigation(covering, {
    type: 'coverFinished',
  })

  return transitionNavigation(revealing, { type: 'revealFinished' })
}

describe('transitionNavigation', () => {
  it('inicia em room sem destino ou efeito', () => {
    expect(initialNavigationState).toEqual({
      currentScene: 'room',
      targetScene: null,
      phase: 'idle',
      effect: 'none',
    })
  })

  it('completa room → draw → room com brush', () => {
    const draw = completeNavigation(initialNavigationState, 'draw', 'brush')
    const room = completeNavigation(draw, 'room', 'brush')

    expect(draw).toEqual({
      currentScene: 'draw',
      targetScene: null,
      phase: 'idle',
      effect: 'none',
    })
    expect(room).toEqual(initialNavigationState)
  })

  it('completa room → cat → room com cat', () => {
    const cat = completeNavigation(initialNavigationState, 'cat', 'cat')
    const room = completeNavigation(cat, 'room', 'cat')

    expect(cat).toEqual({
      currentScene: 'cat',
      targetScene: null,
      phase: 'idle',
      effect: 'none',
    })
    expect(room).toEqual(initialNavigationState)
  })

  it('troca a cena apenas depois que o overlay cobre a anterior', () => {
    const covering = transitionNavigation(initialNavigationState, {
      type: 'navigate',
      targetScene: 'draw',
      effect: 'brush',
    })
    const revealing = transitionNavigation(covering, {
      type: 'coverFinished',
    })

    expect(covering).toEqual({
      currentScene: 'room',
      targetScene: 'draw',
      phase: 'covering',
      effect: 'brush',
    })
    expect(revealing).toEqual({
      currentScene: 'draw',
      targetScene: null,
      phase: 'revealing',
      effect: 'brush',
    })
  })

  it('ignora navegação repetida ou concorrente', () => {
    const covering = transitionNavigation(initialNavigationState, {
      type: 'navigate',
      targetScene: 'draw',
      effect: 'brush',
    })
    const repeated = transitionNavigation(covering, {
      type: 'navigate',
      targetScene: 'draw',
      effect: 'brush',
    })
    const concurrent = transitionNavigation(covering, {
      type: 'navigate',
      targetScene: 'cat',
      effect: 'cat',
    })
    const revealing = transitionNavigation(covering, {
      type: 'coverFinished',
    })
    const concurrentWhileRevealing = transitionNavigation(revealing, {
      type: 'navigate',
      targetScene: 'cat',
      effect: 'cat',
    })

    expect(repeated).toBe(covering)
    expect(concurrent).toBe(covering)
    expect(concurrentWhileRevealing).toBe(revealing)
  })

  it('ignora navegação para a cena que já está ativa', () => {
    const result = transitionNavigation(initialNavigationState, {
      type: 'navigate',
      targetScene: 'room',
      effect: 'brush',
    })

    expect(result).toBe(initialNavigationState)
  })

  it('ignora eventos de conclusão fora da fase correspondente', () => {
    const coverResult = transitionNavigation(initialNavigationState, {
      type: 'coverFinished',
    })
    const revealResult = transitionNavigation(initialNavigationState, {
      type: 'revealFinished',
    })

    expect(coverResult).toBe(initialNavigationState)
    expect(revealResult).toBe(initialNavigationState)
  })

  it('cancela covering sem trocar a cena', () => {
    const covering = transitionNavigation(initialNavigationState, {
      type: 'navigate',
      targetScene: 'draw',
      effect: 'brush',
    })

    expect(
      transitionNavigation(covering, { type: 'cancelNavigation' }),
    ).toEqual(initialNavigationState)
  })

  it('cancela revealing preservando a cena que já foi trocada', () => {
    const covering = transitionNavigation(initialNavigationState, {
      type: 'navigate',
      targetScene: 'cat',
      effect: 'cat',
    })
    const revealing = transitionNavigation(covering, {
      type: 'coverFinished',
    })

    expect(
      transitionNavigation(revealing, { type: 'cancelNavigation' }),
    ).toEqual({
      currentScene: 'cat',
      targetScene: null,
      phase: 'idle',
      effect: 'none',
    })
  })

  it('não altera o estado de entrada', () => {
    const state = { ...initialNavigationState }

    transitionNavigation(state, {
      type: 'navigate',
      targetScene: 'draw',
      effect: 'brush',
    })

    expect(state).toEqual(initialNavigationState)
  })
})

describe('createNavigationStore', () => {
  it('expõe os eventos síncronos sem depender de React ou timers', () => {
    vi.useFakeTimers()
    const store = createNavigationStore()

    store.getState().navigate('draw', 'brush')
    store.getState().coverFinished()
    store.getState().revealFinished()

    expect(store.getState()).toMatchObject({
      currentScene: 'draw',
      targetScene: null,
      phase: 'idle',
      effect: 'none',
    })
    expect(vi.getTimerCount()).toBe(0)

    vi.useRealTimers()
  })
})
