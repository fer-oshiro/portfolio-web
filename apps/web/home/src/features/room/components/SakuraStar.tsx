import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useControls } from 'leva'
import { cameraStore } from '../../scene-navigation/camera/camera-store'
import type { CameraCoords } from '../../scene-navigation/camera/camera-types'
import { Billboard } from '@react-three/drei'
import { useStore } from 'zustand'

function SakuraStar({
  position = [0, 0, 0],
  color = '#FFB7C5',
  size = 0.15,
  loc,
  onActivate,
}: {
  position?: [number, number, number]
  color?: string
  size?: number
  loc: CameraCoords
  onActivate: () => void
}) {
  const progress = useRef(0)
  const focus = useStore(cameraStore, (state) => state.focus)
  const hover = useStore(cameraStore, (state) => state.hover)
  const { torus } = useControls('Stars', {
    torus: {
      value: [0.2, 0.03, 16],
    },
  })
  const ref = useRef<THREE.Mesh<
    THREE.ShapeGeometry,
    THREE.MeshBasicMaterial
  > | null>(null)
  const torusRef = useRef<THREE.Mesh<
    THREE.TorusGeometry,
    THREE.MeshBasicMaterial
  > | null>(null)
  const colorA = useMemo(() => new THREE.Color('#FFB7C5'), [])
  const colorB = useMemo(() => new THREE.Color('#d9687f'), [])
  const colorC = useMemo(() => new THREE.Color('#fcf768'), [])

  const shape = useMemo(() => {
    const star = new THREE.Shape()
    const points = 5
    const outerRadius = size
    const innerRadius = size * 0.4

    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points - Math.PI / 2
      const radius = i % 2 === 0 ? outerRadius : innerRadius
      const x = Math.cos(angle) * radius
      const y = Math.sin(angle) * radius
      i === 0 ? star.moveTo(x, y) : star.lineTo(x, y)
    }
    star.closePath()
    return star
  }, [size])

  // Animação de flutuar + girar
  useFrame((state, delta) => {
    if (ref.current && torusRef.current) {
      ref.current.rotation.z += 0.01
      torusRef.current.rotation.z += Math.max(progress.current, 0.1) * 0.2
      torusRef.current.rotation.y += Math.max(progress.current, 0.1) * 0.2
      torusRef.current.rotation.x += Math.max(progress.current, 0.1) * 0.2

      if (hover === loc && focus !== loc) {
        progress.current = Math.min(progress.current + delta / 1.2, 1)
      } else {
        progress.current = Math.max(progress.current - delta / 1.2, 0)
      }

      torusRef.current.material.color.lerpColors(
        colorA,
        colorB,
        focus === loc ? 1 : progress.current,
      )

      ref.current.material.color.lerpColors(
        colorA,
        colorC,
        focus === loc ? 1 : progress.current,
      )

      if (progress.current === 1) {
        onActivate()
      }
    }
  })

  return (
    <>
      <group position={position}>
        <Billboard>
          <mesh ref={ref}>
            <shapeGeometry args={[shape]} />
            <meshBasicMaterial color={color} side={THREE.DoubleSide} />
          </mesh>
        </Billboard>
        <mesh ref={torusRef}>
          <torusGeometry args={[...torus, 100]} />
          <meshBasicMaterial color={color} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </>
  )
}

export default SakuraStar
