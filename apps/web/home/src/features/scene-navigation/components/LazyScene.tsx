import { Suspense, use, useEffect, useSyncExternalStore } from 'react'
import { useStore } from 'zustand'

import { navigationStore } from '../navigation-store'
import type { Scene } from '../navigation-types'
import { reportSceneFailure } from '../scene-failure'
import {
  shouldRequestScene,
  type SceneModule,
  type SceneRegistry,
} from '../scene-registry'
import { SceneErrorBoundary } from './SceneErrorBoundary'
import { SceneReady } from './SceneReady'

export function useSceneModule<K extends Scene>(
  registry: SceneRegistry<K>,
  scene: K,
) {
  return useSyncExternalStore(registry.subscribe, () =>
    registry.getEntry(scene),
  )
}

function LoadedScene({
  result,
  scene,
  active,
}: {
  result: Promise<SceneModule | null>
  scene: Scene
  active: boolean
}) {
  const module = use(result)
  if (!module) return null

  const { Scene: Content } = module

  return (
    <>
      <Content active={active} />
      {/* Commits only after the content, assets included, has mounted. */}
      <SceneReady scene={scene} />
    </>
  )
}

type LazySceneProps<K extends Scene> = {
  scene: K
  registry: SceneRegistry<K>
  active: boolean
  onFailed?: (scene: Scene) => void
}

export function LazyScene<K extends Scene>({
  scene,
  registry,
  active,
  onFailed,
}: LazySceneProps<K>) {
  const entry = useSceneModule(registry, scene)
  const targeted = useStore(
    navigationStore,
    (state) => state.targetScene === scene,
  )

  // Start right away when the scene becomes the target before any preload,
  // and retry a failed attempt once per navigation. A failure while targeted
  // must not trigger another load.
  useEffect(() => {
    if (shouldRequestScene(registry.getEntry(scene).status, targeted)) {
      registry.preload(scene)
    }
  }, [registry, scene, targeted])

  // Runs after the request effect, so a stale failure that was just retried
  // reads as loading here and is not reported.
  useEffect(() => {
    if (
      entry.status === 'failed' &&
      registry.getEntry(scene).status === 'failed' &&
      reportSceneFailure(scene)
    ) {
      onFailed?.(scene)
    }
  }, [entry.status, onFailed, registry, scene, targeted])

  if (!entry.result) return null

  return (
    <SceneErrorBoundary key={entry.attempt} scene={scene} onFailed={onFailed}>
      {/* Only this scene suspends; the rest of the viewport keeps rendering. */}
      <Suspense fallback={null}>
        <LoadedScene result={entry.result} scene={scene} active={active} />
      </Suspense>
    </SceneErrorBoundary>
  )
}
