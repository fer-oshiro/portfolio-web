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
        style={{
          position: 'fixed',
          top: '40px',
          left: '40px',
          width: '100px',
          height: '40px',
          backgroundColor: '#e6b092',
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '20px',
          border: 'none',
          cursor: 'pointer',
          pointerEvents: 'auto',
          zIndex: 9999,
        }}
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
