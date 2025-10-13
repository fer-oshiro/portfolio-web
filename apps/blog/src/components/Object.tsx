import { a, useSpring } from '@react-spring/three'
import { useGLTF, useTexture } from '@react-three/drei'
import { useEffect } from 'react'
import * as THREE from 'three'
import { MeshBasicMaterial, SRGBColorSpace } from 'three'

export function LoadObject({
  model,
  texture,
}: {
  model: string
  texture?: string
}) {
  const { scene } = useGLTF(model)
  const [springs, api] = useSpring(() => ({
    scale: 0.2,
    config: { tension: 320, friction: 12, mass: 1 },
  }))

  useEffect(() => {
    api.start({ scale: 1 })
  }, [api])
  if (texture) {
    const tex = useTexture(texture)
    tex.colorSpace = SRGBColorSpace
    tex.flipY = false
    scene.traverse((obj: THREE.Object3D) => {
      if (obj instanceof THREE.Mesh && obj.isMesh)
        obj.material = new MeshBasicMaterial({ map: tex })
    })
  }

  return (
    <a.group scale={springs.scale.to((s) => [s, s, s])}>
      <primitive object={scene} />
    </a.group>
  )
}
