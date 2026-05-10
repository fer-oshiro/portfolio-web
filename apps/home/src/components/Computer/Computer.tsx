import { Html } from '@react-three/drei'

import './Computer.css'
import { useControls } from 'leva'
import { Window } from './Window'
import { useStore } from '../../store'

export const Computer = () => {
  const { focus } = useStore()
  const { distanceFactor, position } = useControls('PC', {
    distanceFactor: 1.2,
    position: {
      value: [0, 4.05, -3.6],
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
      {focus === 'pc' && (
        <div className="htmlscreen">
          <Window />
        </div>
      )}
    </Html>
  )
}
