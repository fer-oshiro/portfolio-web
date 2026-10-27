import { useEffect, useRef } from 'react'

import { useSceneController } from '../../scene-navigation'
import glass from '../assets/glass.mp3'
import pawn from '../assets/pawn_the-grey-room_golden-palms.mp3'
import wood from '../assets/wood.mp3'
import {
  createCatAudioController,
  type CatAudioController,
} from '../audio/cat-audio-controller'
import { catGameStore } from '../cat-game-store'

import './CatGameOverlay.css'

type CatGameOverlayProps = {
  active: boolean
}

export const CatGameOverlay = ({ active }: CatGameOverlayProps) => {
  const { navigateTo } = useSceneController()
  const audioRef = useRef<CatAudioController | null>(null)

  // Created in the effect so a remount or Strict Mode replay disposes the
  // previous controller instead of leaking it.
  useEffect(() => {
    const audio = createCatAudioController({
      musicUrl: pawn,
      effectUrls: { glass, wood },
      effectsVolume: () => catGameStore.getState().effectsVolume,
      onMusicStatusChange: catGameStore.getState().setMusicStatus,
    })
    audioRef.current = audio

    return () => {
      audio.dispose()
      audioRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!active) audioRef.current?.stopAll()
  }, [active])

  useEffect(() => {
    if (!active) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') navigateTo('room')
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [active, navigateTo])

  return (
    <div className="cat-game-overlay">
      <div>
        <button onClick={() => audioRef.current?.toggleEffect('glass')}>
          Play Glass
        </button>
        <button onClick={() => audioRef.current?.toggleEffect('wood')}>
          Play Wood
        </button>
        <button onClick={() => void audioRef.current?.playMusic()}>
          Play Song
        </button>
        <button onClick={() => audioRef.current?.stopMusic()}>Stop Song</button>
        <button onClick={() => navigateTo('room')}>Voltar</button>
      </div>
    </div>
  )
}
