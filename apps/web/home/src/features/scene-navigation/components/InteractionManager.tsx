import { useThree } from '@react-three/fiber'
import { useEffect, type RefObject } from 'react'
import * as THREE from 'three'
import { useStore } from 'zustand'

import { remoteControlStore } from '../../remote-control'
import { cameraStore } from '../camera/camera-store'

export function InteractionManager({
  root,
  active,
  onFocus,
}: {
  customX?: number
  customY?: number
  root: RefObject<THREE.Object3D | null>
  active: boolean
  onFocus: (object: THREE.Object3D) => void
}) {
  const setHover = useStore(cameraStore, (state) => state.setHover)
  const { camera, raycaster, size } = useThree()

  useEffect(() => {
    if (!active) return

    const pointer = new THREE.Vector2()
    const castRay = (pixelX: number, pixelY: number) => {
      // Only the active scene root may be hit; visibility alone does not
      // stop a raycast.
      if (!root.current) return

      pointer.set(
        (pixelX / size.width) * 2 - 1,
        -(pixelY / size.height) * 2 + 1,
      )

      raycaster.setFromCamera(pointer, camera)
      const firstHit = raycaster.intersectObject(root.current, true)[0]

      if (firstHit) {
        onFocus(firstHit.object)

        if (firstHit.object.userData.focusTarget) {
          setHover(firstHit.object.userData.focusTarget)
        } else {
          setHover('default')
        }
      }
    }

    const currentPosition = remoteControlStore.getState().cursorPosition
    castRay(currentPosition.x, currentPosition.y)

    return remoteControlStore.subscribe((state, previousState) => {
      if (state.cursorPosition === previousState.cursorPosition) return

      castRay(state.cursorPosition.x, state.cursorPosition.y)
    })
  }, [
    active,
    camera,
    onFocus,
    raycaster,
    root,
    setHover,
    size.height,
    size.width,
  ])

  return null
}

export default InteractionManager
