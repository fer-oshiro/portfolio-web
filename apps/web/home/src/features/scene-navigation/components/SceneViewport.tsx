import { Canvas, events, useThree, type RootStore } from '@react-three/fiber'
import {
  useEffect,
  type CSSProperties,
  type PropsWithChildren,
  type ReactNode,
} from 'react'
import { useStore } from 'zustand'

import { remoteControlStore } from '../../remote-control'
import { CameraController } from '../camera/camera-controller'
import { navigationStore } from '../navigation-store'
import {
  filterActiveSceneHits,
  selectSceneViewport,
} from '../scene-viewport-model'

// R3F raycasts every object with handlers, visible or not; drop hits that
// belong to an inactive scene root.
const activeSceneEvents = (store: RootStore) => ({
  ...events(store),
  filter: filterActiveSceneHits,
})

// R3F only applies props while the container has a size, so the hidden
// viewport keeps its box and leaves the flow instead of using display: none.
const shownStyle: CSSProperties = {
  position: 'relative',
  width: '100vw',
  height: '100vh',
}
const hiddenStyle: CSSProperties = {
  ...shownStyle,
  position: 'absolute',
  top: 0,
  left: 0,
  visibility: 'hidden',
}

// The render loop stops under frameloop "never" and setFrameloop alone does
// not restart it.
function ResumeRenderLoop() {
  const frameloop = useThree((state) => state.frameloop)
  const invalidate = useThree((state) => state.invalidate)

  useEffect(() => {
    if (frameloop === 'always') invalidate()
  }, [frameloop, invalidate])

  return null
}

type SceneViewportProps = PropsWithChildren<{
  overlay?: ReactNode
}>

export function SceneViewport({ overlay, children }: SceneViewportProps) {
  const currentScene = useStore(navigationStore, (state) => state.currentScene)
  const phase = useStore(navigationStore, (state) => state.phase)
  const { visible, frameloop } = selectSceneViewport({ currentScene, phase })
  const connected = useStore(remoteControlStore, (state) => state.connected)
  const setCursorPosition = useStore(
    remoteControlStore,
    (state) => state.setCursorPosition,
  )
  const castRay = (castX: number, castY: number) => {
    if (!connected)
      setCursorPosition({
        x: castX,
        y: castY,
      })
  }

  return (
    <div style={visible ? shownStyle : hiddenStyle}>
      <Canvas
        dpr={[1, 1.5]}
        camera={{
          fov: 75,
        }}
        frameloop={frameloop}
        events={activeSceneEvents}
        style={{ zIndex: 1 }}
        onPointerMove={(e) => castRay(e.clientX, e.clientY)}
      >
        <ResumeRenderLoop />
        <CameraController />
        {children}
      </Canvas>
      {overlay}
    </div>
  )
}
