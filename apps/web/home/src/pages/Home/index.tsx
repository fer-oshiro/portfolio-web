import { Suspense, useEffect } from 'react'
import { CatMiniGame } from '../../features/cat-game'
import { Draw } from '../../features/drawing'
import { WebSocket } from '../../features/remote-control'
import { Room } from '../../features/room'
import { CameraToDefault, Transition } from '../../features/scene-navigation'
import { useStore } from '../../store'
import { Leva } from 'leva'
import { useLocation } from 'react-router'

export const Home = () => {
  const loc = useLocation()
  const { location, setViewport, viewport } = useStore()
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
        <Room show={location === 'room'} />
        <Draw show={location === 'draw'} />
        <CatMiniGame show={location === 'cat'} />
      </Suspense>
    </>
  )
}
