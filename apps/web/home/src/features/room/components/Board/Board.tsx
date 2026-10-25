import { Image } from '@react-three/drei'
import { useControls } from 'leva'

import awsDeveloper from '../../assets/aws-developer.png'
import awsPractioner from '../../assets/aws-practioner.png'

import { DrawingGallery } from '../../../gallery'
import { Info } from './Info'

function AWS({ active, onVideoRequested }: BoardProps) {
  const {
    positionDeveloper,
    pinDeveloper,
    positionPractioner,
    pinPractioner,
    scale,
    pin,
  } = useControls('Drawings', {
    positionDeveloper: {
      value: [4.47, 7.35, -1.26],
    },
    pinDeveloper: {
      value: [4.46, 7.56, -1.24],
    },
    positionPractioner: {
      value: [4.46, 7.2, -0.8],
    },
    pinPractioner: {
      value: [4.45, 7.4, -0.8],
    },
    scale: 0.45,
    pin: 0.05,
  })

  return (
    <>
      <mesh position={pinDeveloper} rotation={[0, -Math.PI * 0.5, 0.1]}>
        <circleGeometry args={[pin, 32]} />
        <meshBasicMaterial color="#e6b092" />
      </mesh>
      <Image
        url={awsDeveloper}
        position={positionDeveloper}
        rotation={[0, -Math.PI * 0.5, 0.2]}
        scale={scale}
        transparent
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
        onClick={() =>
          window.open(
            'https://www.credly.com/badges/29c2403c-b065-47fc-b9b7-dcdf9259dd5a/public_url',
            '_blank',
          )
        }
      />
      <mesh position={pinPractioner} rotation={[0, -Math.PI * 0.5, 0]}>
        <circleGeometry args={[pin, 32]} />
        <meshBasicMaterial color="#a38063" />
      </mesh>
      <Image
        url={awsPractioner}
        position={positionPractioner}
        rotation={[0, -Math.PI * 0.5, -0.1]}
        scale={scale}
        transparent
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
        onClick={() =>
          window.open(
            'https://www.credly.com/badges/d22936cd-37b9-46ab-bb5b-e6555b2287f8/public_url',
            '_blank',
          )
        }
      />
      <Info active={active} onVideoRequested={onVideoRequested} />
    </>
  )
}

export const Board = ({ active, onVideoRequested }: BoardProps) => {
  return (
    <>
      <AWS active={active} onVideoRequested={onVideoRequested} />
      <DrawingGallery />
    </>
  )
}

interface BoardProps {
  active: boolean
  onVideoRequested: () => void
}
