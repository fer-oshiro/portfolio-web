import { OrbitControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useControls } from 'leva'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

import { useStore } from '../../../store'
import {
  hasCameraArrived,
  initialCameraState,
  selectCameraPose,
} from './camera-model'
import type { CameraPose } from './camera-types'

function readCurrentPose(
  camera: THREE.Camera,
  controls: OrbitControlsImpl,
): CameraPose {
  return {
    coord: [camera.position.x, camera.position.y, camera.position.z],
    target: [controls.target.x, controls.target.y, controls.target.z],
  }
}

export const CameraController = () => {
  const orbitRef = useRef<OrbitControlsImpl | null>(null)
  const focus = useStore((state) => state.focus)
  const viewport = useStore((state) => state.viewport)
  const destination = selectCameraPose({ focus, viewport })
  const intro = selectCameraPose(initialCameraState)
  const moving = useRef(true)
  const smoothCameraPosition = useRef(new THREE.Vector3(...intro.coord))
  const smoothCameraTarget = useRef(new THREE.Vector3(...intro.target))
  const destinationPosition = useMemo(
    () => new THREE.Vector3(...destination.coord),
    [destination],
  )
  const destinationTarget = useMemo(
    () => new THREE.Vector3(...destination.target),
    [destination],
  )

  const [values, setControls] = useControls('Camera', () => ({
    control: false,
    position: {
      value: [0, 5, 10],
      step: 0.1,
    },
    target: {
      value: [0, 0, 0],
      step: 0.01,
    },
  }))

  useEffect(() => {
    moving.current = true
  }, [destination])

  useFrame((state, delta) => {
    const controls = orbitRef.current
    if (!controls) return

    const current = readCurrentPose(state.camera, controls)
    setControls({
      position: [...current.coord],
      target: [...current.target],
    })

    if (!moving.current) {
      smoothCameraPosition.current.copy(state.camera.position)
      smoothCameraTarget.current.copy(controls.target)
      return
    }

    if (hasCameraArrived(current, destination)) {
      smoothCameraPosition.current.copy(destinationPosition)
      smoothCameraTarget.current.copy(destinationTarget)
      state.camera.position.copy(destinationPosition)
      controls.target.copy(destinationTarget)
      controls.update()
      moving.current = false
      return
    }

    smoothCameraPosition.current.lerp(
      destinationPosition,
      Math.min(2 * delta, 1),
    )
    smoothCameraTarget.current.lerp(destinationTarget, Math.min(5 * delta, 1))
    state.camera.position.copy(smoothCameraPosition.current)
    controls.target.copy(smoothCameraTarget.current)
    controls.update()
  })

  return <OrbitControls ref={orbitRef} enabled={values.control} />
}
