import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type PropsWithChildren,
} from 'react'

import { useStore } from '../../store'
import { navigationStore } from './navigation-store'
import {
  resolveSceneControllerIntent,
  type RoomHotspot,
  type SceneControllerIntent,
} from './scene-controller-model'
import type { Scene } from './navigation-types'

type SceneControllerValue = {
  activateHotspot: (hotspot: RoomHotspot) => void
  navigateTo: (targetScene: Scene) => void
  resetCamera: () => void
}

const SceneControllerContext = createContext<SceneControllerValue | null>(null)

export function SceneController({ children }: PropsWithChildren) {
  const dispatch = useCallback((intent: SceneControllerIntent) => {
    const navigation = navigationStore.getState()
    const camera = useStore.getState()
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
        useStore.getState().setCamera(command.focus)
      } else {
        navigationStore.getState().navigate(command.targetScene, command.effect)
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
