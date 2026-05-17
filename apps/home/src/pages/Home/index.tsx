import { Suspense, useEffect, useState } from 'react'
import { Transition } from '../../components/Transition'
import { WebSocket } from '../../components/WebSocket'
import { useStore } from '../../store'
import { CatMiniGame } from './Cat'
import Draw from './Draw'
import Room from './Room'
import { CameraToDefault } from '../../components/CameraToDefault'
import { Leva } from 'leva'
import { useLocation } from 'react-router'

export const Home = () => {
  const loc = useLocation()
  const { location, setMobile, mobile } = useStore()
  useEffect(() => {
    if (window.innerWidth > 700) setMobile(false)
  }, [])

  return (
    <>
      <Transition />
      {!mobile && <WebSocket />}
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
