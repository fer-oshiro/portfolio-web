import { Html } from '@react-three/drei'
import { useRef } from 'react'
import * as Tone from 'tone'

import glass from '../../assets/sounds/glass.mp3'
import pawn from '../../assets/sounds/pawn_the-grey-room_golden-palms.mp3'
import wood from '../../assets/sounds/wood.mp3'
import { useStore } from '../../store'

export const Game = () => {
  const { setLocation, setTransition } = useStore()
  const musicRef = useRef<Tone.Player>(null)
  const woodRef = useRef(new Audio(wood))
  const glassRef = useRef(new Audio(glass))

  const start = async () => {
    await Tone.start()

    musicRef.current = new Tone.Player({
      url: pawn,
      onload: () => {
        console.log('Música carregada com sucesso!')
      },
      autostart: true,
    }).toDestination()

    Tone.Transport.bpm.value = 120
    Tone.Transport.start()
  }

  const stop = () => {
    musicRef.current?.stop()
    Tone.Transport.stop()
  }

  const soundEffect = (type: 'wood' | 'glass') => {
    const audio = type === 'wood' ? woodRef.current : glassRef.current
    if (audio.paused) {
      audio.volume = 0.7
      audio.play()
    } else {
      audio.pause()
    }
  }

  return (
    <Html>
      <div>
        <button onClick={() => soundEffect('glass')}>Play Glass</button>
        <button onClick={() => soundEffect('wood')}>Play Wood</button>
        <button onClick={start}>Play Song</button>
        <button onClick={stop}>Stop Song</button>
        <button
          onClick={() => {
            setTransition('cat')
            setLocation('room')
          }}
        >
          Voltar
        </button>
      </div>
    </Html>
  )
}
