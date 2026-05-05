import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useControls } from 'leva'
import { useStore } from '../store'
import { CameraCoords } from '../store/slices/cameraSlice'
import { Billboard } from '@react-three/drei'

function SakuraStar({
  position = [0, 0, 0],
  color = '#FFB7C5',
  size = 0.15,
  hover = false,
  loc,
}: {
  position?: [number, number, number]
  color?: string
  size?: number
  hover?: boolean
  loc: CameraCoords
}) {
  const progress = useRef(0)
  const { setCamera, focus } = useStore()
  const { torus } = useControls('Stars', {
    torus: {
      value: [0.2, 0.03, 16],
    },
  })
  const ref = useRef(null)
  const torusRef = useRef(null)
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

      if (hover && focus !== loc) {
        progress.current = Math.min(progress.current + delta / 1.7, 1) // 1.2s pra completar
      } else {
        progress.current = Math.max(progress.current - delta / 1.5, 0) // volta mais rápido
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
        setCamera(loc)
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
