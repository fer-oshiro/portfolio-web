import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { useStore } from '../store'

function InteractionManager({
  onFocus,
}: {
  customX?: number
  customY?: number
  onFocus: (bj: any) => void
}) {
  const { setHover, cursorPosition } = useStore()
  const { camera, raycaster, size, scene } = useThree()

  const { x, y } = cursorPosition

  const castRay = (pixelX, pixelY) => {
    const x = (pixelX / size.width) * 2 - 1
    const y = -(pixelY / size.height) * 2 + 1

    raycaster.setFromCamera({ x, y }, camera)
    const hits = raycaster.intersectObjects(scene.children, true)

    if (hits.length > 0) {
      onFocus(hits[0]?.object)

      if (hits[0]?.object.userData.focusTarget) {
        setHover(hits[0]?.object.userData.focusTarget)
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
