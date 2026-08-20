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
  const ready = transitionNavigation(covering, {
    type: 'sceneReady',
    scene: targetScene,
  })
  const revealing = transitionNavigation(ready, {
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

  it('troca a cena depois que o destino fica pronto e o overlay cobre a anterior', () => {
    const covering = transitionNavigation(initialNavigationState, {
      type: 'navigate',
      targetScene: 'draw',
      effect: 'brush',
    })
    const ready = transitionNavigation(covering, {
      type: 'sceneReady',
      scene: 'draw',
    })
    const revealing = transitionNavigation(ready, {
      type: 'coverFinished',
    })

    expect(covering).toEqual({
      currentScene: 'room',
      targetScene: 'draw',
      phase: 'covering',
      effect: 'brush',
      targetStatus: 'loading',
    })
    expect(ready).toEqual({
      currentScene: 'room',
      targetScene: 'draw',
      phase: 'covering',
      effect: 'brush',
      targetStatus: 'ready',
    })
    expect(revealing).toEqual({
      currentScene: 'draw',
      targetScene: null,
      phase: 'revealing',
      effect: 'brush',
    })
  })

  it('permanece coberto até o destino ficar pronto', () => {
    const covering = transitionNavigation(initialNavigationState, {
      type: 'navigate',
      targetScene: 'cat',
      effect: 'cat',
    })
    const covered = transitionNavigation(covering, {
      type: 'coverFinished',
    })
    const revealing = transitionNavigation(covered, {
      type: 'sceneReady',
      scene: 'cat',
    })

    expect(covered).toEqual({
      currentScene: 'room',
      targetScene: 'cat',
      phase: 'covered',
      effect: 'cat',
      targetStatus: 'loading',
    })
    expect(revealing).toEqual({
      currentScene: 'cat',
      targetScene: null,
      phase: 'revealing',
      effect: 'cat',
    })
  })

  it('revela a origem quando o destino falha antes da cobertura terminar', () => {
    const covering = transitionNavigation(initialNavigationState, {
      type: 'navigate',
      targetScene: 'cat',
      effect: 'cat',
    })
    const failed = transitionNavigation(covering, {
      type: 'sceneFailed',
      scene: 'cat',
      reason: 'cat-scene-load-failed',
    })
    const revealing = transitionNavigation(failed, {
      type: 'coverFinished',
    })

    expect(failed).toEqual({
      currentScene: 'room',
      targetScene: 'cat',
      phase: 'covering',
      effect: 'cat',
      targetStatus: 'failed',
    })
    expect(revealing).toEqual({
      currentScene: 'room',
      targetScene: null,
      phase: 'revealing',
      effect: 'cat',
    })
  })

  it('revela a origem quando o destino falha depois da cobertura terminar', () => {
    const covering = transitionNavigation(initialNavigationState, {
      type: 'navigate',
      targetScene: 'cat',
      effect: 'cat',
    })
    const covered = transitionNavigation(covering, {
      type: 'coverFinished',
    })
    const revealing = transitionNavigation(covered, {
      type: 'sceneFailed',
      scene: 'cat',
      reason: 'cat-scene-load-failed',
    })

    expect(revealing).toEqual({
      currentScene: 'room',
      targetScene: null,
      phase: 'revealing',
      effect: 'cat',
    })
  })

  it('ignora readiness de outra cena e eventos terminais duplicados', () => {
    const covering = transitionNavigation(initialNavigationState, {
      type: 'navigate',
      targetScene: 'cat',
      effect: 'cat',
    })
    const wrongScene = transitionNavigation(covering, {
      type: 'sceneReady',
      scene: 'draw',
    })
    const ready = transitionNavigation(covering, {
      type: 'sceneReady',
      scene: 'cat',
    })
    const duplicateReady = transitionNavigation(ready, {
      type: 'sceneReady',
      scene: 'cat',
    })
    const lateFailure = transitionNavigation(ready, {
      type: 'sceneFailed',
      scene: 'cat',
      reason: 'late-failure',
    })
    const failed = transitionNavigation(covering, {
      type: 'sceneFailed',
      scene: 'cat',
      reason: 'cat-scene-load-failed',
    })
    const duplicateFailure = transitionNavigation(failed, {
      type: 'sceneFailed',
      scene: 'cat',
      reason: 'duplicate-failure',
    })
    const lateReadiness = transitionNavigation(failed, {
      type: 'sceneReady',
      scene: 'cat',
    })

    expect(wrongScene).toBe(covering)
    expect(duplicateReady).toBe(ready)
    expect(lateFailure).toBe(ready)
    expect(duplicateFailure).toBe(failed)
    expect(lateReadiness).toBe(failed)
  })

  it('ignora readiness atrasada depois de cancelar a navegação', () => {
    const covering = transitionNavigation(initialNavigationState, {
      type: 'navigate',
      targetScene: 'cat',
      effect: 'cat',
    })
    const cancelled = transitionNavigation(covering, {
      type: 'cancelNavigation',
    })

    expect(
      transitionNavigation(cancelled, {
        type: 'sceneReady',
        scene: 'cat',
      }),
    ).toBe(cancelled)
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
    const ready = transitionNavigation(covering, {
      type: 'sceneReady',
      scene: 'draw',
    })
    const revealing = transitionNavigation(ready, {
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

  it('cancela covered e limpa a tentativa ativa sem trocar a cena', () => {
    const covering = transitionNavigation(initialNavigationState, {
      type: 'navigate',
      targetScene: 'cat',
      effect: 'cat',
    })
    const covered = transitionNavigation(covering, {
      type: 'coverFinished',
    })

    expect(transitionNavigation(covered, { type: 'cancelNavigation' })).toEqual(
      initialNavigationState,
    )
  })

  it('cancela revealing preservando a cena que já foi trocada', () => {
    const covering = transitionNavigation(initialNavigationState, {
      type: 'navigate',
      targetScene: 'cat',
      effect: 'cat',
    })
    const ready = transitionNavigation(covering, {
      type: 'sceneReady',
      scene: 'cat',
    })
    const revealing = transitionNavigation(ready, {
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
    store.getState().sceneReady('draw')
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
