import { Environment, OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { LoadObject } from '../../components/Object'
import monkeyUrl from './models/monkey/monkey.glb'
import rocketUrl from './models/rocket/skyrocket.glb'

export function FirstPost() {
  return (
    <div>
      <h1>First Post</h1>

      <div>Primeiro objeto feito</div>
      <div>
        <Canvas style={{ width: 400, height: 400 }}>
          <Suspense fallback={null}>
            <LoadObject model={monkeyUrl} />
            <Environment preset="apartment" />
          </Suspense>
          <OrbitControls enableDamping makeDefault />
        </Canvas>
      </div>
      <div>
        <Canvas style={{ width: 400, height: 400 }}>
          <Suspense fallback={null}>
            <LoadObject model={rocketUrl} scale={0.4} />
            <Environment preset="apartment" />
          </Suspense>
          <OrbitControls enableDamping makeDefault />
        </Canvas>
      </div>
    </div>
  )
}
