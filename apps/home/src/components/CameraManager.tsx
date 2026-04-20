import { OrbitControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { button, useControls } from 'leva'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three/examples/jsm/controls/OrbitControls.js'

import { useStore } from '../store'
import { useNavigate } from 'react-router'

export const CameraManager = () => {
  const navigate = useNavigate()
  const orbitRef = useRef<OrbitControlsImpl>(null)
  const { position, setCamera, moving, setMoving } = useStore()

  const direction = useRef(new THREE.Vector3())
  const smoothCameraPosition = useRef(new THREE.Vector3(...position.coord))
  const smoothCameraTarget = useRef(new THREE.Vector3(...position.target))

  const [values, set] = useControls('Camera', () => ({
    control: false,
    position: {
      value: [0, 5, 10],
      step: 0.1,
    },
    target: {
      value: [0, 0, 0],
      step: 0.01,
    },
    default: button(() => setCamera('default')),
    pc: button(() => setCamera('pc')),
    board: button(() => setCamera('board')),
    draw: button(() => {
      setCamera('draw')
      navigate('/draw')
    }),
  }))

  useFrame(async (state, delta) => {
    if (!direction.current || !orbitRef.current) return
    const [x = 0, y = 0, z = 0] = state.camera.position
    state.camera.getWorldDirection(direction.current)
    direction.current.normalize()
    const { x: tx, y: ty, z: tz } = orbitRef.current.target
    set({ position: [x, y, z], target: [tx, ty, tz] })

    // Camera
    const closerValue = Math.max(
      Math.abs(position.coord[0] - x),
      Math.abs(position.coord[1] - y),
      Math.abs(position.coord[2] - z),
      Math.abs(position.target[0] - tx),
      Math.abs(position.target[1] - ty),
      Math.abs(position.target[2] - tz),
    )

    if ((!values.control || closerValue > 0.05) && moving) {
      const cameraPosition = new THREE.Vector3(...position.coord)
      const cameraTarget = new THREE.Vector3(...position.target)

      smoothCameraPosition.current.lerp(cameraPosition, 2 * delta)
      smoothCameraTarget.current.lerp(cameraTarget, 2 * delta)

      state.camera.position.copy(smoothCameraPosition.current)

      orbitRef.current.target.copy(smoothCameraTarget.current)
      orbitRef.current.update()
    } else {
      if (moving) setMoving(false)
    }
  })

  useEffect(() => {
    setCamera('default')
  }, [])

  return <OrbitControls ref={orbitRef} enabled={values.control} />
}
