import { cameraConfig } from './camera-config'
import type {
  CameraModelEvent,
  CameraModelState,
  CameraPose,
} from './camera-types'

export const initialCameraState: CameraModelState = {
  focus: 'intro',
  hover: 'default',
  viewport: 'mobile',
}

export function transitionCamera(
  state: CameraModelState,
  event: CameraModelEvent,
): CameraModelState {
  switch (event.type) {
    case 'focusChanged':
      if (state.focus === event.focus && state.hover === 'default') return state

      return {
        ...state,
        focus: event.focus,
        hover: 'default',
      }

    case 'hoverChanged':
      if (state.hover === event.hover) return state

      return {
        ...state,
        hover: event.hover,
      }

    case 'viewportChanged':
      if (state.viewport === event.viewport) return state

      return {
        ...state,
        viewport: event.viewport,
      }
  }
}

export function selectCameraPose(
  state: Pick<CameraModelState, 'focus' | 'viewport'>,
): CameraPose {
  return cameraConfig[state.viewport][state.focus]
}

export function getCameraDistance(
  current: CameraPose,
  destination: CameraPose,
): number {
  return Math.max(
    ...current.coord.map((value, index) =>
      Math.abs(destination.coord[index]! - value),
    ),
    ...current.target.map((value, index) =>
      Math.abs(destination.target[index]! - value),
    ),
  )
}

export function hasCameraArrived(
  current: CameraPose,
  destination: CameraPose,
  tolerance = 0.05,
): boolean {
  return getCameraDistance(current, destination) <= tolerance
}
