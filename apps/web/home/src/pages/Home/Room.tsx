import { useGLTF, useTexture } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useControls } from 'leva'
import * as THREE from 'three'

import { Board } from '../../components/Board'
import { CameraManager } from '../../components/CameraManager'
import { Computer } from '../../components/Computer'
import InteractionManager from '../../components/InteractionManager'
import SakuraStar from '../../components/Star'
import { Tricked } from '../../components/Tricked'
import { useStore } from '../../store'

import roomUrl from '../../assets/models/room.glb'
import roomBaked from '../../assets/models/room.png'

function RoomMesh() {
  const { nodes } = useGLTF(roomUrl)
  const roomNodes = nodes as Record<
    | 'Cube'
    | 'Cube001'
    | 'Cube002'
    | 'Cube003'
    | 'Icosphere'
    | 'screen'
    | 'board',
    THREE.Mesh
  >
  const bakedTexture = useTexture(roomBaked)
  const { setCamera } = useStore()

  const { pc, cat, board, draw } = useControls('Stars', {
    pc: {
      value: [0, 5.5, -4],
    },
    cat: {
      value: [3.48, 9.4, -3.39],
    },
    board: {
      value: [4.55, 8.34, 0.33],
    },
    draw: {
      value: [3.61, 3.56, 1.0],
    },
  })
  const { visible } = useControls('Hitbox', {
    visible: false,
  })
  bakedTexture.colorSpace = THREE.SRGBColorSpace
  bakedTexture.flipY = false

  return (
    <group>
      <mesh geometry={roomNodes.Cube.geometry}>
        <meshBasicMaterial map={bakedTexture} />
      </mesh>

      <mesh geometry={roomNodes.Cube001.geometry}>
        <meshBasicMaterial map={bakedTexture} />
      </mesh>

      <mesh geometry={roomNodes.Cube002.geometry}>
        <meshBasicMaterial map={bakedTexture} />
      </mesh>

      <mesh geometry={roomNodes.Cube003.geometry}>
        <meshBasicMaterial color="white" />
      </mesh>

      <mesh geometry={roomNodes.Icosphere.geometry}>
        <meshBasicMaterial color="red" />
      </mesh>
      <group position={cat}>
        <mesh
          visible={visible}
          scale={[1.5, 1.5, 1.5]}
          position={[0, -0.5, 0]}
          userData={{ focusTarget: 'cat' }}
          onClick={() => setCamera('cat')}
          onPointerEnter={() => (document.body.style.cursor = 'pointer')}
          onPointerLeave={() => (document.body.style.cursor = 'default')}
        >
          <boxGeometry args={[1, 1]} />
          <meshBasicMaterial color="red" wireframe />
        </mesh>
        <SakuraStar loc="cat" />
      </group>

      <mesh geometry={roomNodes.screen.geometry}>
        <meshBasicMaterial map={bakedTexture} />
        <Computer />
      </mesh>
      <group position={pc}>
        <mesh
          visible={visible}
          scale={[2, 2.5, 1.5]}
          position={[0, -1.25, 0]}
          userData={{ focusTarget: 'pc' }}
          onClick={() => setCamera('pc')}
          onPointerEnter={() => (document.body.style.cursor = 'pointer')}
          onPointerLeave={() => (document.body.style.cursor = 'default')}
        >
          <boxGeometry args={[1, 1]} />
          <meshBasicMaterial color="red" wireframe />
        </mesh>
        <SakuraStar loc="pc" />
      </group>

      <mesh geometry={roomNodes.board.geometry}>
        <meshBasicMaterial map={bakedTexture} />
        <Board />
      </mesh>
      <group position={board}>
        <mesh
          visible={visible}
          scale={[1, 4, 4]}
          position={[0, -1.8, 0]}
          userData={{ focusTarget: 'board' }}
          onClick={() => setCamera('board')}
          onPointerEnter={() => (document.body.style.cursor = 'pointer')}
          onPointerLeave={() => (document.body.style.cursor = 'default')}
        >
          <boxGeometry args={[1, 1]} />
          <meshBasicMaterial color="red" wireframe />
        </mesh>
        <SakuraStar loc="board" />
      </group>

      <group position={draw}>
        <mesh
          visible={visible}
          scale={[1, 1, 4]}
          position={[-0.4, 0, 0]}
          userData={{ focusTarget: 'draw' }}
          onClick={() => setCamera('draw')}
          onPointerEnter={() => (document.body.style.cursor = 'pointer')}
          onPointerLeave={() => (document.body.style.cursor = 'default')}
        >
          <boxGeometry args={[1, 1]} />
          <meshBasicMaterial color="red" wireframe />
        </mesh>
        <SakuraStar loc="draw" />
      </group>
    </group>
  )
}

function Room({ show }: { show: boolean }) {
  const { connected, setCursorPosition } = useStore()
  const castRay = (castX: number, castY: number) => {
    if (!connected)
      setCursorPosition({
        x: castX,
        y: castY,
      })
  }

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: show ? 'block' : 'none',
      }}
    >
      <Tricked />

      <Canvas
        dpr={[1, 1.5]}
        camera={{
          fov: 75,
        }}
        style={{ zIndex: 1 }}
        onPointerMove={(e) => castRay(e.clientX, e.clientY)}
      >
        <CameraManager />
        <InteractionManager onFocus={(obj) => {}} />

        <color attach="background" args={['#996754']} />
        <directionalLight position={[10, 10, 5]} intensity={15} />
        <RoomMesh />
      </Canvas>
    </div>
  )
}

export default Room
