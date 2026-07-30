import {
  Image,
  MeshPortalMaterial,
  Stars,
  Text,
  useTexture,
} from '@react-three/drei'
import { useControls } from 'leva'
import { useMemo } from 'react'
import * as THREE from 'three'

import github from '../../../../assets/github.png'
import linkedin from '../../../../assets/linkedin.png'
import { useStore } from '../../../../store'
import SP42 from '../../assets/42SP.png'
import confia from '../../assets/confia.png'
import eu from '../../assets/eu.png'
import yt from '../../assets/yt.png'

function useSpaceGradient() {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 2
    canvas.height = 256

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Canvas 2D context is not available')
    }
    const gradient = ctx.createLinearGradient(0, 0, 0, 256)
    gradient.addColorStop(0, '#0a0a2e') // azul escuro (topo)
    gradient.addColorStop(0.4, '#1a1060') // azul médio
    gradient.addColorStop(0.45, '#2d1b69') // roxo
    gradient.addColorStop(1, '#4a1060') // roxo escuro (base)

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 2, 256)

    return new THREE.CanvasTexture(canvas)
  }, [])
}

export function Info() {
  const { setTricked } = useStore()
  const gradientTexture = useSpaceGradient()
  const foto = useTexture(eu)
  const ytTexture = useTexture(yt)
  const githubTexture = useTexture(github)
  const linkedinTexture = useTexture(linkedin)
  const {
    position,
    rotation,
    text,
    profile,
    user,
    confiaScale,
    linkedinP,
    githubP,
    ytP,
  } = useControls('Info', {
    position: {
      value: [4.46, 6, 1.7],
    },
    rotation: {
      value: [0, -Math.PI * 0.5, -0.2],
    },
    text: {
      value: [0, 0.4, 0],
    },
    profile: {
      value: [0, 0.21, 0],
    },
    user: {
      value: [0, 0.06, 0],
    },
    confiaScale: {
      value: [0.31, 0.16],
    },
    linkedinP: {
      value: [-0.12, -0.4, 0],
    },
    githubP: {
      value: [0, -0.4, 0],
    },
    ytP: {
      value: [0.12, -0.4, 0],
    },
  })

  const opts = {
    height: '390',
    width: '640',
    playerVars: {
      autoplay: 1,
      controls: 1,
    },
  }

  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[0.4, 1]} />
      <MeshPortalMaterial resolution={512} blur={0}>
        <ambientLight intensity={4} />

        <mesh>
          <planeGeometry args={[0.8, 1]} />
          <meshBasicMaterial map={gradientTexture} depthWrite={false} />
        </mesh>
        <Stars
          radius={100}
          depth={50}
          count={25000}
          factor={3}
          speed={0.1}
          fade
        />

        <Image url={SP42} scale={[0.3, 0.1]} position={text} transparent />

        <mesh position={profile}>
          <circleGeometry args={[0.1, 32]} />
          <meshStandardMaterial map={foto} />
        </mesh>

        <Text
          fontSize={0.04}
          letterSpacing={0.02}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          position={user}
        >
          fsayuri-
        </Text>

        <Image
          url={confia}
          scale={confiaScale}
          position={[0, -0.15, 0]}
          transparent
        />

        <mesh
          position={linkedinP}
          onPointerOver={() => (document.body.style.cursor = 'pointer')}
          onPointerOut={() => (document.body.style.cursor = 'auto')}
          onClick={() =>
            window.open(
              'https://www.linkedin.com/in/fernanda-oshiro/',
              '_blank',
            )
          }
        >
          <circleGeometry args={[0.05, 32]} />
          <meshStandardMaterial map={linkedinTexture} />
        </mesh>

        <group position={githubP}>
          <mesh>
            <circleGeometry args={[0.051, 32]} />
            <meshBasicMaterial color="white" />
          </mesh>
          <mesh
            onPointerOver={() => (document.body.style.cursor = 'pointer')}
            onPointerOut={() => (document.body.style.cursor = 'auto')}
            onClick={() =>
              window.open('https://github.com/fer-oshiro/', '_blank')
            }
            position={[0, 0, 0.001]}
          >
            <circleGeometry args={[0.05, 32]} />
            <meshStandardMaterial
              map={githubTexture}
              transparent={true}
              depthWrite={false}
            />
          </mesh>
        </group>
        <mesh
          position={ytP}
          onPointerOver={() => (document.body.style.cursor = 'pointer')}
          onPointerOut={() => (document.body.style.cursor = 'auto')}
          onClick={() => setTricked(true)}
        >
          <circleGeometry args={[0.05, 32]} />
          <meshStandardMaterial map={ytTexture} />
        </mesh>
      </MeshPortalMaterial>
    </mesh>
  )
}
