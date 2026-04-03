import { useFrame, useThree } from '@react-three/fiber'
import { useControls } from 'leva'
import { useEffect } from 'react'

export const CameraControl = () => {
  const { camera } = useThree()
  const { position, rotation } = useControls('Camera', {
    position: {
      value: [0, 5, 10],
      step: 0.1,
    },
    rotation: {
      value: [0, 0, 0],
      step: 0.01,
    },
  })

  useEffect(() => {
    camera.position.set(...position)
    camera.rotation.set(...rotation)
  }, [position, rotation, camera])

  return <></>
}
