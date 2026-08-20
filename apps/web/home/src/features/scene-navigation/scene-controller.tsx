import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type PropsWithChildren,
} from 'react'

import { cameraStore } from './camera/camera-store'
import { navigationStore } from './navigation-store'
import {
  resolveSceneControllerIntent,
  type RoomHotspot,
  type SceneControllerIntent,
} from './scene-controller-model'
import type { ActiveTransitionEffect, Scene } from './navigation-types'

type SceneControllerValue = {
  activateHotspot: (hotspot: RoomHotspot) => void
  navigateTo: (targetScene: Scene) => void
  resetCamera: () => void
}

const SceneControllerContext = createContext<SceneControllerValue | null>(null)

function navigateToEagerScene(
  targetScene: Scene,
  effect: ActiveTransitionEffect,
) {
  navigationStore.getState().navigate(targetScene, effect)

  const navigation = navigationStore.getState()

  // Temporary Phase 1 bridge: every current scene is already mounted eagerly.
  // Phase 5 must replace this with readiness emitted by the scene runtime.
  if (
    navigation.phase === 'covering' &&
    navigation.targetScene === targetScene &&
    navigation.targetStatus === 'loading'
  ) {
    navigation.sceneReady(targetScene)
  }
}

export function SceneController({ children }: PropsWithChildren) {
  const dispatch = useCallback((intent: SceneControllerIntent) => {
    const navigation = navigationStore.getState()
    const camera = cameraStore.getState()
    const commands = resolveSceneControllerIntent(
      {
        currentScene: navigation.currentScene,
        phase: navigation.phase,
        focus: camera.focus,
      },
      intent,
    )

    for (const command of commands) {
      if (command.type === 'focusCamera') {
        cameraStore.getState().setCamera(command.focus)
      } else {
        navigateToEagerScene(command.targetScene, command.effect)
      }
    }
  }, [])

  const value = useMemo<SceneControllerValue>(
    () => ({
      activateHotspot: (hotspot) =>
        dispatch({ type: 'hotspotActivated', hotspot }),
      navigateTo: (targetScene) =>
        dispatch({ type: 'sceneRequested', targetScene }),
      resetCamera: () => dispatch({ type: 'cameraResetRequested' }),
    }),
    [dispatch],
  )

  return (
    <SceneControllerContext.Provider value={value}>
      {children}
    </SceneControllerContext.Provider>
  )
}

export function useSceneController(): SceneControllerValue {
  const controller = useContext(SceneControllerContext)

  if (!controller) {
    throw new Error('useSceneController must be used within SceneController')
  }

  return controller
}
