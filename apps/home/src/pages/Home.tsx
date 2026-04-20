import { useGLTF, useTexture } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'

import roomUrl from '../assets/models/room.glb'
import roomBaked from '../assets/models/room.png'
import { CameraManager } from '../components/CameraManager'
import { Computer } from '../components/Computer'
import { Transition } from '../components/transition'

function Room() {
  const { nodes } = useGLTF(roomUrl)
  const bakedTexture = useTexture(roomBaked)
  bakedTexture.colorSpace = THREE.SRGBColorSpace
  bakedTexture.flipY = false

  console.log(nodes.Cube002)

  return (
    <group>
      <mesh geometry={nodes.Cube.geometry}>
        <meshBasicMaterial map={bakedTexture} />
      </mesh>

      <mesh geometry={nodes.Cube001.geometry}>
        <meshBasicMaterial map={bakedTexture} />
      </mesh>

      <mesh geometry={nodes.Cube002.geometry}>
        <meshBasicMaterial map={bakedTexture} />
      </mesh>

      <mesh geometry={nodes.screen.geometry}>
        <meshBasicMaterial map={bakedTexture} />
        <Computer />
      </mesh>

      <mesh geometry={nodes.board.geometry}>
        <meshBasicMaterial map={bakedTexture} />
      </mesh>
    </group>
  )
}

function Home() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Transition />

      <Canvas
        dpr={[1, 1.5]}
        camera={{
          fov: 75,
        }}
      >
        <CameraManager />

        <color attach="background" args={['#996754']} />
        <directionalLight position={[10, 10, 5]} intensity={15} />

        <Room />
      </Canvas>
    </div>
  )
}

export default Home
