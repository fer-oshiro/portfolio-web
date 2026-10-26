import { useEffect } from 'react'

import { cameraStore } from './camera/camera-store'
import type { Scene } from './navigation-types'
import type { SceneRegistry } from './scene-registry'
import { scheduleIdle } from './schedule-idle'

// Preloading goes through the same registry load the navigation uses.
export function useScenePreload<K extends Scene>(
  registry: SceneRegistry<K>,
  scene: K,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled) return

    const cancelIdle = scheduleIdle(() => registry.preload(scene))
    const unsubscribe = cameraStore.subscribe((state, previousState) => {
      if (state.hover === scene && previousState.hover !== scene) {
        registry.preload(scene)
      }
    })

    return () => {
      cancelIdle()
      unsubscribe()
    }
  }, [enabled, registry, scene])
}
