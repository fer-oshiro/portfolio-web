import { Suspense, useEffect } from 'react'
import { useStore as useNavigationStore } from 'zustand'
import { CatMiniGame } from '../../features/cat-game'
import { Draw } from '../../features/drawing'
import { WebSocket } from '../../features/remote-control'
import { Room } from '../../features/room'
import {
  CameraToDefault,
  navigationStore,
  Transition,
} from '../../features/scene-navigation'
import { useStore } from '../../store'
import { Leva } from 'leva'
import { useLocation } from 'react-router'

export const Home = () => {
  const loc = useLocation()
  const currentScene = useNavigationStore(
    navigationStore,
    (state) => state.currentScene,
  )
  const setViewport = useStore((state) => state.setViewport)
  const viewport = useStore((state) => state.viewport)

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
        <Room show={currentScene === 'room'} />
        <Draw show={currentScene === 'draw'} />
        <CatMiniGame show={currentScene === 'cat'} />
      </Suspense>
    </>
  )
}
