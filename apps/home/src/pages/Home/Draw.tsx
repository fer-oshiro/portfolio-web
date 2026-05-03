import { Canvas } from '../../components/Canvas'
import { useStore } from '../../store'

function Draw({ show }: { show: boolean }) {
  const { setLocation, setTransition } = useStore()
  return (
    <div
      style={{
        backgroundColor: '#996754',
        height: '100dvh',
        display: show ? 'flex' : 'none',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <button
        onClick={() => {
          setTransition('brush')
          setLocation('room')
        }}
      >
        Voltar
      </button>

      <Canvas />
    </div>
  )
}

export default Draw
