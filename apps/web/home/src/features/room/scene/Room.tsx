import { Canvas } from '@react-three/fiber'
import { useCallback, useState } from 'react'
import { useStore } from 'zustand'

import { remoteControlStore } from '../../remote-control'
import { useSceneController } from '../../scene-navigation'
import { RoomOverlay } from '../components/RoomOverlay'
import { RoomScene } from './RoomScene'

function Room({ show }: { show: boolean }) {
  const [videoOpen, setVideoOpen] = useState(false)
  const connected = useStore(remoteControlStore, (state) => state.connected)
  const setCursorPosition = useStore(
    remoteControlStore,
    (state) => state.setCursorPosition,
  )
  const { activateHotspot } = useSceneController()
  const openVideo = useCallback(() => setVideoOpen(true), [])
  const closeVideo = useCallback(() => setVideoOpen(false), [])
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
      <RoomOverlay videoOpen={videoOpen} onVideoClose={closeVideo} />

      <Canvas
        dpr={[1, 1.5]}
        camera={{
          fov: 75,
        }}
        style={{ zIndex: 1 }}
        onPointerMove={(e) => castRay(e.clientX, e.clientY)}
      >
        <RoomScene
          onHotspotActivated={activateHotspot}
          onVideoRequested={openVideo}
        />
      </Canvas>
    </div>
  )
}

export default Room
