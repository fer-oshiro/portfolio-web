import { Transition } from '../../components/Transition'
import { WebSocket } from '../../components/WebSocket'
import { useStore } from '../../store'
import { CatMiniGame } from './Cat'
import Draw from './Draw'
import Room from './Room'

export const Home = () => {
  const { location } = useStore()
  return (
    <>
      <WebSocket />
      <Transition />
      <Room show={location === 'room'} />
      <Draw show={location === 'draw'} />
      <CatMiniGame show={location === 'cat'} />
    </>
  )
}
