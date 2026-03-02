import { OrbitControls, useGLTF } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import roomUrl from '../assets/models/room.glb'
import { QRCode } from '../components/QRCode'

function Room() {
  const { scene } = useGLTF(roomUrl)
  return <primitive object={scene} />
}

export default function Home() {
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
