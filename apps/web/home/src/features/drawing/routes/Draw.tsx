import { useStore } from 'zustand'

import { navigationStore } from '../../scene-navigation/navigation-store'
import { Canvas } from '../components/Canvas'

function Draw({ show }: { show: boolean }) {
  const navigate = useStore(navigationStore, (state) => state.navigate)

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
        onClick={() => navigate('room', 'brush')}
      >
        Voltar
      </button>
      <Canvas />
    </div>
  )
}

export default Draw
