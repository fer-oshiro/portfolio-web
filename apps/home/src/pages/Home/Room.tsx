import { useGLTF, useTexture } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Leva, useControls } from 'leva'
import * as THREE from 'three'

import { Board } from '../../components/Board'
import { CameraManager } from '../../components/CameraManager'
import { Computer } from '../../components/Computer'
import { Tricked } from '../../components/Tricked'

import roomUrl from '../../assets/models/room.glb'
import roomBaked from '../../assets/models/room.png'
import SakuraStar from '../../components/Star'
import { useState } from 'react'

function RoomMesh() {
  const { nodes } = useGLTF(roomUrl)
  const bakedTexture = useTexture(roomBaked)
  const [hover, setHover] = useState({
    pc: false,
    cat: false,
    board: false,
    drawing: false,
  })
  const { pc, cat, board, draw } = useControls('Stars', {
    pc: {
      value: [0, 5.5, -4],
    },
    cat: {
      value: [3.48, 9.4, -3.39],
    },
    board: {
      value: [3.48, 8.8, 1.0],
    },
    draw: {
      value: [3.61, 3.56, 1.0],
    },
  })
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

      <mesh geometry={nodes.Cube002.geometry}>
        <meshBasicMaterial map={bakedTexture} />
      </mesh>

      <mesh geometry={nodes.Cube003.geometry}>
        <meshBasicMaterial color="white" />
      </mesh>

      <mesh
        geometry={nodes.Icosphere.geometry}
        onPointerEnter={() =>
          setHover({
            pc: false,
            cat: true,
            board: false,
            drawing: false,
          })
        }
        onPointerLeave={() => setHover((prev) => ({ ...prev, cat: false }))}
      >
        <meshBasicMaterial color="red" />
        <SakuraStar position={cat} loc="cat" hover={hover.cat} />
      </mesh>

      <mesh
        geometry={nodes.screen.geometry}
        onPointerEnter={() =>
          setHover({
            pc: true,
            cat: false,
            board: false,
            drawing: false,
          })
        }
        onPointerLeave={() => setHover((prev) => ({ ...prev, pc: false }))}
      >
        <meshBasicMaterial map={bakedTexture} />
        <SakuraStar position={pc} hover={hover.pc} loc="pc" />
        <Computer />
      </mesh>

      <mesh
        geometry={nodes.board.geometry}
        onPointerEnter={() =>
          setHover({
            pc: false,
            cat: false,
            board: true,
            drawing: false,
          })
        }
        onPointerLeave={() => setHover((prev) => ({ ...prev, board: false }))}
      >
        <meshBasicMaterial map={bakedTexture} />
        <SakuraStar position={board} loc="board" />
        <Board />
      </mesh>

      <SakuraStar position={draw} loc="draw" />
    </group>
  )
}

function Room({ show }: { show: boolean }) {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: show ? 'block' : 'none',
      }}
    >
      <Leva />
      <Tricked />

      <Canvas
        dpr={[1, 1.5]}
        camera={{
          fov: 75,
        }}
      >
        <CameraManager />

        <color attach="background" args={['#996754']} />
        <directionalLight position={[10, 10, 5]} intensity={15} />

        <RoomMesh />
      </Canvas>
    </div>
  )
}

export default Room
