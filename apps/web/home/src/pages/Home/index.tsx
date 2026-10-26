import { Suspense, useCallback, useEffect, useState } from 'react'
import { useStore } from 'zustand'
import { Draw } from '../../features/drawing'
import { WebSocket } from '../../features/remote-control'
import { RoomOverlay, RoomScene } from '../../features/room'
import {
  CameraToDefault,
  cameraStore,
  LazyScene,
  navigationStore,
  SceneFailureNotice,
  SceneReady,
  SceneViewport,
  Transition,
  useSceneController,
  useSceneModule,
  useScenePreload,
  type Scene,
} from '../../features/scene-navigation'
import { Leva } from 'leva'
import { useLocation } from 'react-router'

import { sceneRegistry } from './scene-registry'

export const Home = () => {
  const loc = useLocation()
  const currentScene = useStore(navigationStore, (state) => state.currentScene)
  const navigationIdle = useStore(
    navigationStore,
    (state) => state.phase === 'idle',
  )
  const setViewport = useStore(cameraStore, (state) => state.setViewport)
  const viewport = useStore(cameraStore, (state) => state.viewport)
  const { activateHotspot } = useSceneController()
  const [videoOpen, setVideoOpen] = useState(false)
  const openVideo = useCallback(() => setVideoOpen(true), [])
  const closeVideo = useCallback(() => setVideoOpen(false), [])
  const [booted, setBooted] = useState(false)
  const finishBoot = useCallback(() => setBooted(true), [])
  const [failedScene, setFailedScene] = useState<Scene | null>(null)
  const dismissFailure = useCallback(() => setFailedScene(null), [])
  const CatOverlay = useSceneModule(sceneRegistry, 'cat').module?.Overlay

  useScenePreload(sceneRegistry, 'cat', booted)

  useEffect(() => {
    if (window.innerWidth > 700) setViewport('desktop')
  }, [setViewport])

  return (
    <>
      <Transition onBootFinished={finishBoot} />
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
              {CatOverlay && (
                <div hidden={currentScene !== 'cat'}>
                  <CatOverlay />
                </div>
              )}
            </>
          }
        >
          <RoomScene
            active={currentScene === 'room'}
            onHotspotActivated={activateHotspot}
            onVideoRequested={openVideo}
          />
          <SceneReady scene="room" />
          <LazyScene
            scene="cat"
            registry={sceneRegistry}
            active={currentScene === 'cat'}
            onFailed={setFailedScene}
          />
        </SceneViewport>
        <Draw show={currentScene === 'draw'} />
        <SceneReady scene="draw" />
      </Suspense>
      {/* Shown once the origin is revealed again. */}
      {failedScene && navigationIdle && (
        <SceneFailureNotice onDismiss={dismissFailure} />
      )}
    </>
  )
}
