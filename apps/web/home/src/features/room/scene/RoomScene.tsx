import { useGLTF, useTexture } from '@react-three/drei'
import { useControls } from 'leva'
import { useRef } from 'react'
import * as THREE from 'three'

import {
  InteractionManager,
  SceneRoot,
  type RoomHotspot,
} from '../../scene-navigation'
import { Board } from '../components/Board/Board'
import { Computer } from '../components/Computer/Computer'
import SakuraStar from '../components/SakuraStar'

import roomUrl from '../assets/models/room.glb'
import roomBaked from '../assets/models/room.png'

type RoomMeshProps = {
  active: boolean
  onHotspotActivated: (hotspot: RoomHotspot) => void
  onVideoRequested: () => void
}

function RoomMesh({
  active,
  onHotspotActivated,
  onVideoRequested,
}: RoomMeshProps) {
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
          onClick={() => onHotspotActivated('cat')}
          onPointerEnter={() => (document.body.style.cursor = 'pointer')}
          onPointerLeave={() => (document.body.style.cursor = 'default')}
        >
          <boxGeometry args={[1, 1]} />
          <meshBasicMaterial color="red" wireframe />
        </mesh>
        <SakuraStar
          loc="cat"
          active={active}
          onActivate={() => onHotspotActivated('cat')}
        />
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
          onClick={() => onHotspotActivated('pc')}
          onPointerEnter={() => (document.body.style.cursor = 'pointer')}
          onPointerLeave={() => (document.body.style.cursor = 'default')}
        >
          <boxGeometry args={[1, 1]} />
          <meshBasicMaterial color="red" wireframe />
        </mesh>
        <SakuraStar
          loc="pc"
          active={active}
          onActivate={() => onHotspotActivated('pc')}
        />
      </group>

      <mesh geometry={roomNodes.board.geometry}>
        <meshBasicMaterial map={bakedTexture} />
        <Board active={active} onVideoRequested={onVideoRequested} />
      </mesh>
      <group position={board}>
        <mesh
          visible={visible}
          scale={[1, 4, 4]}
          position={[0, -1.8, 0]}
          userData={{ focusTarget: 'board' }}
          onClick={() => onHotspotActivated('board')}
          onPointerEnter={() => (document.body.style.cursor = 'pointer')}
          onPointerLeave={() => (document.body.style.cursor = 'default')}
        >
          <boxGeometry args={[1, 1]} />
          <meshBasicMaterial color="red" wireframe />
        </mesh>
        <SakuraStar
          loc="board"
          active={active}
          onActivate={() => onHotspotActivated('board')}
        />
      </group>

      <group position={draw}>
        <mesh
          visible={visible}
          scale={[1, 1, 4]}
          position={[-0.4, 0, 0]}
          userData={{ focusTarget: 'draw' }}
          onClick={() => onHotspotActivated('draw')}
          onPointerEnter={() => (document.body.style.cursor = 'pointer')}
          onPointerLeave={() => (document.body.style.cursor = 'default')}
        >
          <boxGeometry args={[1, 1]} />
          <meshBasicMaterial color="red" wireframe />
        </mesh>
        <SakuraStar
          loc="draw"
          active={active}
          onActivate={() => onHotspotActivated('draw')}
        />
      </group>
    </group>
  )
}

export function RoomScene({
  active,
  onHotspotActivated,
  onVideoRequested,
}: RoomMeshProps) {
  const rootRef = useRef<THREE.Group>(null)

  return (
    <>
      {/* Attached to the shared scene, so it must leave with the room. */}
      {active && <color attach="background" args={['#996754']} />}

      <SceneRoot ref={rootRef} active={active}>
        <InteractionManager
          root={rootRef}
          active={active}
          onFocus={(obj) => {}}
        />

        <directionalLight position={[10, 10, 5]} intensity={15} />
        <RoomMesh
          active={active}
          onHotspotActivated={onHotspotActivated}
          onVideoRequested={onVideoRequested}
        />
      </SceneRoot>
    </>
  )
}
