import { Html } from '@react-three/drei'

import './Computer.css'
import { useControls } from 'leva'
import { AssistantWindow } from '../../../assistant'
import { useStore } from '../../../../store'

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
          <AssistantWindow />
        </div>
      )}
    </Html>
  )
}
