import { Suspense, useCallback, useEffect, useState } from 'react'
import { useStore } from 'zustand'
import { CatGameOverlay, CatScene } from '../../features/cat-game'
import { Draw } from '../../features/drawing'
import { WebSocket } from '../../features/remote-control'
import { RoomOverlay, RoomScene } from '../../features/room'
import {
  CameraToDefault,
  cameraStore,
  navigationStore,
  SceneViewport,
  Transition,
  useSceneController,
} from '../../features/scene-navigation'
import { Leva } from 'leva'
import { useLocation } from 'react-router'

export const Home = () => {
  const loc = useLocation()
  const currentScene = useStore(navigationStore, (state) => state.currentScene)
  const setViewport = useStore(cameraStore, (state) => state.setViewport)
  const viewport = useStore(cameraStore, (state) => state.viewport)
  const { activateHotspot } = useSceneController()
  const [videoOpen, setVideoOpen] = useState(false)
  const openVideo = useCallback(() => setVideoOpen(true), [])
  const closeVideo = useCallback(() => setVideoOpen(false), [])

  useEffect(() => {
    if (window.innerWidth > 700) setViewport('desktop')
  }, [setViewport])

  return (
    <>
      <Transition />
      {viewport === 'desktop' && <WebSocket />}
      <Leva hidden={!loc.hash.includes('leva')} />
      <CameraToDefault />
      <Suspense>
        <SceneViewport
          overlay={
            <>
              <div hidden={currentScene !== 'room'}>
                <RoomOverlay videoOpen={videoOpen} onVideoClose={closeVideo} />
              </div>
              <div hidden={currentScene !== 'cat'}>
                <CatGameOverlay />
              </div>
            </>
          }
        >
          <RoomScene
            active={currentScene === 'room'}
            onHotspotActivated={activateHotspot}
            onVideoRequested={openVideo}
          />
          <CatScene active={currentScene === 'cat'} />
        </SceneViewport>
        <Draw show={currentScene === 'draw'} />
      </Suspense>
    </>
  )
}
