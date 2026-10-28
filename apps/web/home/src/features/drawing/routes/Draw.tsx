import { useEffect, useRef } from 'react'
import { useHoverSelect, useSceneController } from '../../scene-navigation'
import { Canvas } from '../components/Canvas'

import './Draw.css'

function Draw({ show }: { show: boolean }) {
  const { navigateTo } = useSceneController()
  const backRef = useRef<HTMLButtonElement>(null)

  useHoverSelect(backRef, () => navigateTo('room'), show)

  useEffect(() => {
    if (!show) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return

      // Escape while typing the name just leaves the field
      if (
        event.target instanceof HTMLInputElement &&
        event.target.type === 'text'
      ) {
        event.target.blur()
        return
      }

      navigateTo('room')
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [show, navigateTo])

  return (
    <div className="draw-page" hidden={!show}>
      <button
        ref={backRef}
        className="draw-page__back"
        onClick={() => navigateTo('room')}
      >
        Voltar
      </button>
      <Canvas />
    </div>
  )
}

export default Draw
