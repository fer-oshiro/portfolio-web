import { OrbitControls, useGLTF } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import roomUrl from '../assets/models/room.glb'
import { QRCode } from '../components/QRCode'
import useWebSocket, { ReadyState } from 'react-use-websocket'
import { WS_URL } from '../service/constants'
import { useEffect } from 'react'

function Room() {
  const { scene } = useGLTF(roomUrl)
  return <primitive object={scene} />
}

export default function Home() {
  const { sendJsonMessage, lastJsonMessage, readyState, sendMessage } =
    useWebSocket(WS_URL, {
      share: false,
      shouldReconnect: () => false,
    })

  useEffect(() => {
    console.log('Connection state changed')
    if (readyState === ReadyState.OPEN) {
      sendMessage('hei')
    }
  }, [readyState])

  useEffect(() => {
    console.log(`Got a new message: ${JSON.stringify(lastJsonMessage)}`)
  }, [lastJsonMessage])

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <QRCode />
      <Canvas camera={{ position: [0, 5, 10], fov: 50 }}>
        <color attach="background" args={['#996754']} />
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} />

        <Room />
        <OrbitControls />
      </Canvas>
    </div>
  )
}
