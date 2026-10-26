import { cameraStore } from './camera/camera-store'
import { navigationStore } from './navigation-store'
import type { Scene } from './navigation-types'

export function reportSceneFailure(scene: Scene, reason = 'scene-load-failed') {
  const navigation = navigationStore.getState()
  if (navigation.targetScene !== scene) return false

  navigation.sceneFailed(scene, reason)
  // The navigation already focused the camera on the target. The origin is
  // revealed again, so give it back its default view while still covered.
  cameraStore.getState().setCamera('default')
  return true
}
