import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import * as THREE from 'three'

import { useStore } from '../../../store'

export function InteractionManager({
  onFocus,
}: {
  customX?: number
  customY?: number
  onFocus: (object: THREE.Object3D) => void
}) {
  const { setHover, cursorPosition } = useStore()
  const { camera, raycaster, size, scene } = useThree()

  const { x, y } = cursorPosition

  const castRay = (pixelX: number, pixelY: number) => {
    const x = (pixelX / size.width) * 2 - 1
    const y = -(pixelY / size.height) * 2 + 1

    raycaster.setFromCamera(new THREE.Vector2(x, y), camera)
    const hits = raycaster.intersectObjects(scene.children, true)
    const firstHit = hits[0]

    if (firstHit) {
      onFocus(firstHit.object)

      if (firstHit.object.userData.focusTarget) {
        setHover(firstHit.object.userData.focusTarget)
      } else {
        setHover('default')
      }
    }
  }

  useEffect(() => {
    if (x !== undefined && y !== undefined) {
      castRay(x, y)
    }
  }, [x, y])

  return null
}

export default InteractionManager
