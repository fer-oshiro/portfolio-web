import { useCallback, type PropsWithChildren, type RefObject } from 'react'
import type * as THREE from 'three'

import { markSceneRoot } from '../scene-viewport-model'

type SceneRootProps = PropsWithChildren<{
  active: boolean
  ref?: RefObject<THREE.Group | null>
}>

export function SceneRoot({ active, ref, children }: SceneRootProps) {
  const attachRoot = useCallback(
    (group: THREE.Group | null) => {
      if (group) markSceneRoot(group)
      if (ref) ref.current = group
    },
    [ref],
  )

  return (
    <group ref={attachRoot} visible={active}>
      {children}
    </group>
  )
}
