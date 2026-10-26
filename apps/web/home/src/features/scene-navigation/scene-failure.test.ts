import { beforeEach, describe, expect, it } from 'vitest'

import { initialCameraState } from './camera/camera-model'
import { cameraStore } from './camera/camera-store'
import { initialNavigationState, navigationStore } from './navigation-store'
import { reportSceneFailure } from './scene-failure'

beforeEach(() => {
  navigationStore.setState(initialNavigationState)
  cameraStore.setState(initialCameraState)
})

describe('reportSceneFailure', () => {
  it('falha a navegação do destino e devolve a câmera à vista padrão', () => {
    cameraStore.getState().setCamera('cat')
    navigationStore.getState().navigate('cat', 'cat')

    expect(reportSceneFailure('cat')).toBe(true)
    expect(navigationStore.getState()).toMatchObject({
      currentScene: 'room',
      targetScene: 'cat',
      targetStatus: 'failed',
    })
    expect(cameraStore.getState().focus).toBe('default')
  })

  it('ignora a falha de uma cena que não é o destino', () => {
    cameraStore.getState().setCamera('cat')

    expect(reportSceneFailure('cat')).toBe(false)
    expect(navigationStore.getState()).toMatchObject(initialNavigationState)
    expect(cameraStore.getState().focus).toBe('cat')
  })

  it('ignora a falha de outra cena durante uma navegação', () => {
    navigationStore.getState().navigate('draw', 'brush')

    expect(reportSceneFailure('cat')).toBe(false)
    expect(navigationStore.getState()).toMatchObject({
      targetScene: 'draw',
      targetStatus: 'loading',
    })
  })
})
