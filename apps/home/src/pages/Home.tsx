import { OrbitControls, useGLTF, useTexture } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'

import roomUrl from '../assets/models/room.glb'
import roomBaked from '../assets/models/room.png'
import { CameraControl } from '../components/Camera'

function Room() {
  const { nodes } = useGLTF(roomUrl)
  const bakedTexture = useTexture(roomBaked)
  bakedTexture.colorSpace = THREE.SRGBColorSpace
  bakedTexture.flipY = false

  return (
    <group>
      <mesh geometry={nodes.Cube.geometry}>
        <meshBasicMaterial map={bakedTexture} />
      </mesh>

      <mesh geometry={nodes.Cube001.geometry}>
        <meshBasicMaterial map={bakedTexture} />
      </mesh>

      <mesh geometry={nodes.screen.geometry}>
        <meshBasicMaterial map={bakedTexture} />
      </mesh>

      <mesh geometry={nodes.board.geometry}>
        <meshBasicMaterial map={bakedTexture} />
      </mesh>
    </group>
  )
}

export default function Home() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas camera={{ position: [0, 5, 10], fov: 75 }}>
        <CameraControl />

        <color attach="background" args={['#996754']} />
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} />

        <Room />
        <OrbitControls />
      </Canvas>
    </div>
  )
}
