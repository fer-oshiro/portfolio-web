import { Environment, OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { LoadObject } from '../../components/Object'
import backed from './models//monkey/backed.png'
import monkeyUrl from './models/monkey/monkey.glb'

export function FirstPost() {
  return (
    <div>
      <h1>First Post</h1>

      <div>Primeiro objeto feito</div>
      <Canvas style={{ width: 400, height: 400 }}>
        <Suspense fallback={null}>
          <LoadObject model={monkeyUrl} />
          <Environment preset="apartment" />
        </Suspense>
        <OrbitControls enableDamping makeDefault />
      </Canvas>
    </div>
  )
}
