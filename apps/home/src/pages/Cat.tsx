import { Canvas } from '@react-three/fiber'
import { Game } from '../components/Game'

export const Cat = () => {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas>
        <Game />
      </Canvas>
    </div>
  )
}
