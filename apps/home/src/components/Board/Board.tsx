import { Image, RoundedBox, Text } from '@react-three/drei'
import { useControls } from 'leva'
import { useEffect, useMemo, useState } from 'react'
import useWebSocket from 'react-use-websocket'

import awsDeveloper from '../../assets/aws-developer.png'
import awsPractioner from '../../assets/aws-practioner.png'

import { WS_URL } from '../../service/constants'
import { Info } from './Info'
import { useStore } from '../../store'

type Drawings = {
  url: string
  id: string | undefined
}
interface IWebsocket {
  drawings: Drawings[]
  type: 'chunk' | 'done'
}

const SKIP_POSITIONS = [0, 1, 7, 8, 19, 20, 26, 27]

function DrawingItem({
  img,
  position,
}: {
  img: Drawings
  position: [number, number, number]
}) {
  const SIZE = 0.25
  const [x, y, z] = position
  const rotationZ = useMemo(() => (Math.random() - 0.5) * 0.2, [])
  const height = useMemo(() => (Math.random() - 0.5) * 0.05, [])

  if (process.env.NODE_ENV === 'development') return <></>

  return (
    <group
      position={[x, y + height, z]}
      rotation={[0, -Math.PI * 0.5, rotationZ]}
    >
      <RoundedBox
        args={[SIZE + 0.1, SIZE + 0.15, 0.01]}
        radius={0.02}
        smoothness={4}
        position={[0, 0, -0.01]}
      >
        <meshBasicMaterial color="white" />
      </RoundedBox>

      <Image url={img.url} scale={SIZE} transparent />

      <Text
        position={[-SIZE / 2, -SIZE / 2 - 0.02, 0.01]}
        fontSize={0.03}
        color="black"
        anchorX="left"
        anchorY="top"
      >
        by: {img.id || 'Anonymous'}
      </Text>
    </group>
  )
}

function AWS() {
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
      <Info />
    </>
  )
}

export const Board = () => {
  const { position, columns } = useControls('Drawings', {
    position: {
      value: [4.3, 7.5, -1.2],
    },
    columns: {
      value: 7,
      step: 1,
    },
  })
  const { setStatus } = useStore()
  const [imgs, setImgs] = useState<Drawings[]>([])
  const { sendJsonMessage, lastJsonMessage } = useWebSocket<IWebsocket>(
    WS_URL,
    { share: true },
  )
  useEffect(() => {
    if (imgs.length === 0) {
      sendJsonMessage({
        action: 'get_drawings',
      })
    }
  }, [])

  useEffect(() => {
    if (lastJsonMessage?.drawings) {
      setImgs(lastJsonMessage.drawings)
      if (lastJsonMessage.drawings.length > 0) setStatus('ready')
      else setStatus('server_error')
    }
  }, [lastJsonMessage])
  return (
    <>
      <AWS />
      {imgs?.map((img, index) => {
        let col = index
        SKIP_POSITIONS.forEach((skip) => {
          if (col >= skip) col++
        })

        return (
          <DrawingItem
            key={img.url}
            img={img}
            position={[
              position[0],
              Math.floor(col / columns) * -0.5 + position[1],
              (col % columns) * 0.5 + position[2],
            ]}
          />
        )
      })}
    </>
  )
}
