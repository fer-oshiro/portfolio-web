import { Canvas } from '../components/Canvas'
import { Transition } from '../components/transition'

function Draw() {
  return (
    <div
      style={{
        backgroundColor: '#996754',
        height: '100dvh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Transition />
      <Canvas />
    </div>
  )
}

export default Draw
