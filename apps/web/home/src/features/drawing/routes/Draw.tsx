import { useSceneController } from '../../scene-navigation'
import { Canvas } from '../components/Canvas'

import './Draw.css'

function Draw({ show }: { show: boolean }) {
  const { navigateTo } = useSceneController()

  return (
    <div className="draw-page" hidden={!show}>
      <button className="draw-page__back" onClick={() => navigateTo('room')}>
        Voltar
      </button>
      <Canvas />
    </div>
  )
}

export default Draw
