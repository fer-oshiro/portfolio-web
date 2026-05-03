import { Canvas } from '@react-three/fiber'
import { Game } from '../../components/Game'

export const CatMiniGame = ({ show }: { show: boolean }) => {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: show ? 'block' : 'none',
      }}
    >
      <Canvas
        style={{
          zIndex: 1,
        }}
      >
        <Game />
      </Canvas>
    </div>
  )
}
