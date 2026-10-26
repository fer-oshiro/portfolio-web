import type { ComponentType } from 'react'

export type SceneModule = {
  Scene: ComponentType<{ active: boolean }>
  Overlay?: ComponentType
}

export type SceneLoadStatus = 'not-requested' | 'loading' | 'loaded' | 'failed'

export type SceneEntry<M> = {
  status: SceneLoadStatus
  // Keys the error boundary so each retry mounts a fresh subtree.
  attempt: number
  promise: Promise<M> | null
  // Never rejects: a load failure resolves to null so rendering does not
  // throw inside the Canvas, where R3F reports even caught errors globally.
  result: Promise<M | null> | null
  module: M | null
}

export type SceneRegistry<K extends string, M = SceneModule> = {
  load: (scene: K) => Promise<M>
  preload: (scene: K) => void
  getEntry: (scene: K) => SceneEntry<M>
  subscribe: (listener: () => void) => () => void
}

const notRequested = {
  status: 'not-requested',
  attempt: 0,
  promise: null,
  result: null,
  module: null,
} as const

export function shouldRequestScene(status: SceneLoadStatus, targeted: boolean) {
  return targeted && (status === 'not-requested' || status === 'failed')
}

export function createSceneRegistry<K extends string, M = SceneModule>(
  loaders: Record<K, () => Promise<M>>,
): SceneRegistry<K, M> {
  const entries = new Map<K, SceneEntry<M>>()
  const listeners = new Set<() => void>()

  const getEntry = (scene: K): SceneEntry<M> =>
    entries.get(scene) ?? notRequested

  const update = (scene: K, entry: SceneEntry<M>) => {
    entries.set(scene, entry)
    listeners.forEach((listener) => listener())
  }

  const load = (scene: K) => {
    const current = getEntry(scene)
    if (current.promise && current.status !== 'failed') return current.promise

    const attempt =
      current.status === 'failed' ? current.attempt + 1 : current.attempt
    const promise = loaders[scene]().then(
      (module) => {
        if (getEntry(scene).promise === promise)
          update(scene, { status: 'loaded', attempt, promise, result, module })
        return module
      },
      (error: unknown) => {
        if (getEntry(scene).promise === promise)
          update(scene, {
            status: 'failed',
            attempt,
            promise,
            result,
            module: null,
          })
        throw error
      },
    )
    const result = promise.catch(() => null)

    update(scene, { status: 'loading', attempt, promise, result, module: null })
    return promise
  }

  return {
    load,
    preload: (scene) => {
      load(scene).catch(() => {})
    },
    getEntry,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}
