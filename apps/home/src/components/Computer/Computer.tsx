import { Html } from '@react-three/drei'

import './Computer.css'
import { useControls } from 'leva'
import { Window } from './Window'

export const Computer = () => {
  const { distanceFactor, position } = useControls('PC', {
    distanceFactor: 1.2,
    position: {
      value: [0, 4.05, -3.65],
    },
  })

  return (
    <Html
      transform
      distanceFactor={distanceFactor}
      position={position}
      style={{
        imageRendering: 'auto',
      }}
    >
      <div className="htmlscreen">
        <Window />
      </div>
    </Html>
  )
}
