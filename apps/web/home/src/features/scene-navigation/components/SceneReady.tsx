import { useEffect } from 'react'
import { useStore } from 'zustand'

import { navigationStore } from '../navigation-store'
import type { Scene } from '../navigation-types'

// Mounted after the scene content, so it only runs once that content has
// committed. Scenes stay mounted between visits, so readiness is confirmed
// again every time the scene becomes the target.
export function SceneReady({ scene }: { scene: Scene }) {
  const targeted = useStore(
    navigationStore,
    (state) => state.targetScene === scene,
  )

  useEffect(() => {
    if (targeted) navigationStore.getState().sceneReady(scene)
  }, [scene, targeted])

  return null
}
