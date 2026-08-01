import { Html } from '@react-three/drei'

import './Computer.css'
import { useControls } from 'leva'
import { AssistantWindow } from '../../../assistant'
import {
  RealtimeContextProvider,
  useRealtimeClient,
} from '../../../remote-control/realtime'
import { useStore } from '../../../../store'

export const Computer = () => {
  const { focus } = useStore()
  const realtimeClient = useRealtimeClient()
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
        <RealtimeContextProvider client={realtimeClient}>
          <div className="htmlscreen">
            <AssistantWindow />
          </div>
        </RealtimeContextProvider>
      )}
    </Html>
  )
}
