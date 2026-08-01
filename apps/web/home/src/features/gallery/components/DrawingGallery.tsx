import type { Drawing } from '@fer-oshiro/realtime-contract'
import { Image, RoundedBox, Text } from '@react-three/drei'
import { useControls } from 'leva'
import { useEffect, useMemo, useState } from 'react'
import { useStore } from 'zustand'

import { useRealtime, useRealtimeMessage } from '../../remote-control/realtime'
import { galleryStore } from '../gallery-store'

const SKIP_POSITIONS = [0, 1, 7, 8, 19, 20, 26, 27]

function DrawingItem({
  img,
  position,
}: {
  img: Drawing
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

export function DrawingGallery() {
  const { position, columns } = useControls('Drawings', {
    position: {
      value: [4.3, 7.5, -1.2],
    },
    columns: {
      value: 7,
      step: 1,
    },
  })
  const setDrawingsReady = useStore(
    galleryStore,
    (state) => state.setDrawingsReady,
  )
  const [imgs, setImgs] = useState<Drawing[]>([])
  const { send } = useRealtime()

  useEffect(() => {
    if (imgs.length === 0) {
      send({
        action: 'get_drawings',
      })
    }
  }, [imgs.length, send])

  useRealtimeMessage('drawings', ({ drawings }) => {
    setImgs(drawings)
    setDrawingsReady(true)
  })

  return imgs?.map((img, index) => {
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
  })
}
