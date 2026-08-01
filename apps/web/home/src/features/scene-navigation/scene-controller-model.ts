import type { CameraCoords, CameraFocus } from './camera/camera-types'
import type {
  ActiveTransitionEffect,
  NavigationState,
  Scene,
} from './navigation-types'

export type RoomHotspot = Exclude<CameraCoords, 'default'>

export type SceneControllerState = Pick<
  NavigationState,
  'currentScene' | 'phase'
> & {
  focus: CameraFocus
}

export type SceneControllerIntent =
  | { type: 'hotspotActivated'; hotspot: RoomHotspot }
  | { type: 'sceneRequested'; targetScene: Scene }
  | { type: 'cameraResetRequested' }

export type SceneControllerCommand =
  | { type: 'focusCamera'; focus: CameraCoords }
  | {
      type: 'navigate'
      targetScene: Scene
      effect: ActiveTransitionEffect
    }

const transitionEffects: Partial<
  Record<Scene, Partial<Record<Scene, ActiveTransitionEffect>>>
> = {
  room: {
    draw: 'brush',
    cat: 'cat',
  },
  draw: {
    room: 'brush',
  },
  cat: {
    room: 'cat',
  },
}

function focusCommand(
  currentFocus: CameraFocus,
  nextFocus: CameraCoords,
): SceneControllerCommand[] {
  if (currentFocus === nextFocus) return []

  return [{ type: 'focusCamera', focus: nextFocus }]
}

function resolveSceneRequest(
  state: SceneControllerState,
  targetScene: Scene,
): SceneControllerCommand[] {
  const effect = transitionEffects[state.currentScene]?.[targetScene]

  if (!effect) return []

  const nextFocus = targetScene === 'room' ? 'default' : targetScene

  return [
    ...focusCommand(state.focus, nextFocus),
    { type: 'navigate', targetScene, effect },
  ]
}

export function resolveSceneControllerIntent(
  state: SceneControllerState,
  intent: SceneControllerIntent,
): SceneControllerCommand[] {
  if (state.phase !== 'idle') return []

  switch (intent.type) {
    case 'hotspotActivated':
      if (state.currentScene !== 'room') return []

      if (intent.hotspot === 'draw' || intent.hotspot === 'cat') {
        return resolveSceneRequest(state, intent.hotspot)
      }

      return focusCommand(state.focus, intent.hotspot)

    case 'sceneRequested':
      return resolveSceneRequest(state, intent.targetScene)

    case 'cameraResetRequested':
      if (state.currentScene !== 'room') return []

      return focusCommand(state.focus, 'default')
  }
}
