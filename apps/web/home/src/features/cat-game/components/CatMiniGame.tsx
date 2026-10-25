import { Canvas } from '@react-three/fiber'

import { CatScene } from '../scene/CatScene'
import { CatGameOverlay } from './CatGameOverlay'

export const CatMiniGame = ({ show }: { show: boolean }) => {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: show ? 'block' : 'none',
        position: 'relative',
      }}
    >
      <Canvas
        style={{
          zIndex: 1,
        }}
      >
        <CatScene />
      </Canvas>
      <CatGameOverlay />
    </div>
  )
}
