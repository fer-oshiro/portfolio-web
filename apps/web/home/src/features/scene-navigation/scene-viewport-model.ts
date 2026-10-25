import type * as THREE from 'three'

import type { NavigationState } from './navigation-types'

export type SceneViewportState = {
  visible: boolean
  frameloop: 'always' | 'never'
}

const sceneRootKey = 'sceneRoot'

export function selectSceneViewport({
  currentScene,
  phase,
}: Pick<NavigationState, 'currentScene' | 'phase'>): SceneViewportState {
  const drawing = currentScene === 'draw'

  // Keep rendering while a transition is running so the shared camera keeps
  // interpolating under the cover; pause only once Draw is settled.
  return {
    visible: !drawing,
    frameloop: drawing && phase === 'idle' ? 'never' : 'always',
  }
}

export function markSceneRoot(object: THREE.Object3D) {
  object.userData[sceneRootKey] = true
}

// A scene root is visible only while its scene is active, so its visibility
// decides whether objects below it may receive pointer events.
export function isInActiveScene(object: THREE.Object3D) {
  for (
    let current: THREE.Object3D | null = object;
    current;
    current = current.parent
  ) {
    if (current.userData[sceneRootKey]) return current.visible
  }

  return true
}

export function filterActiveSceneHits<T extends { object: THREE.Object3D }>(
  hits: T[],
) {
  return hits.filter((hit) => isInActiveScene(hit.object))
}
