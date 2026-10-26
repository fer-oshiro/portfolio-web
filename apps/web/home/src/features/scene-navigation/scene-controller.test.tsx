import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it } from 'vitest'

import { initialCameraState } from './camera/camera-model'
import { cameraStore } from './camera/camera-store'
import { initialNavigationState, navigationStore } from './navigation-store'
import { SceneController, useSceneController } from './scene-controller'
import type { ActiveTransitionEffect, Scene } from './navigation-types'

describe('SceneController', () => {
  let controller: ReturnType<typeof useSceneController> | undefined

  beforeEach(() => {
    navigationStore.setState(initialNavigationState)
    cameraStore.setState(initialCameraState)

    const Probe = () => {
      controller = useSceneController()
      return null
    }

    renderToStaticMarkup(
      <SceneController>
        <Probe />
      </SceneController>,
    )
  })

  it.each([
    ['draw', 'brush'],
    ['cat', 'cat'],
  ] as const)(
    'deixa a prontidão de room → %s → room para o runtime das cenas',
    (targetScene: Scene, effect: ActiveTransitionEffect) => {
      controller?.navigateTo(targetScene)

      expect(navigationStore.getState()).toMatchObject({
        currentScene: 'room',
        targetScene,
        phase: 'covering',
        effect,
        targetStatus: 'loading',
      })

      navigationStore.getState().coverFinished()
      expect(navigationStore.getState()).toMatchObject({ phase: 'covered' })

      navigationStore.getState().sceneReady(targetScene)
      navigationStore.getState().revealFinished()
      controller?.navigateTo('room')

      expect(navigationStore.getState()).toMatchObject({
        currentScene: targetScene,
        targetScene: 'room',
        phase: 'covering',
        effect,
        targetStatus: 'loading',
      })

      navigationStore.getState().sceneReady('room')
      navigationStore.getState().coverFinished()
      navigationStore.getState().revealFinished()

      expect(navigationStore.getState()).toMatchObject(initialNavigationState)
    },
  )
})
