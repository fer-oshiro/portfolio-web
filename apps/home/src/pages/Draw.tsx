import { Canvas } from '../components/Canvas'

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
      <Canvas />
    </div>
  )
}

export default Draw
