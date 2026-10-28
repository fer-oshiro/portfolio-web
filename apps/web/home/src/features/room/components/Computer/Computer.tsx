import { Html } from '@react-three/drei'

import { useControls } from 'leva'
import {
  RealtimeContextProvider,
  useRealtimeClient,
} from '../../../remote-control/realtime'
import { cameraStore } from '../../../scene-navigation/camera/camera-store'
import { useStore } from 'zustand'

import { ComputerScreen } from './ComputerScreen'

export const Computer = () => {
  const focus = useStore(cameraStore, (state) => state.focus)
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
          <ComputerScreen />
        </RealtimeContextProvider>
      )}
    </Html>
  )
}
