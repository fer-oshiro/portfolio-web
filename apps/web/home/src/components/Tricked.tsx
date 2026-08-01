import YouTube from 'react-youtube'

import './Tricked.css'

const opts = {
  height: '390',
  width: '640',
  playerVars: {
    autoplay: 1,
    controls: 1,
  },
}

export const Tricked = ({ open, onClose }: TrickedProps) => {
  if (!open) return null
  return (
    <div className="tricked-modal">
      <div className="tricked-modal__backdrop" onClick={onClose} />
      <div className="tricked-modal__content" onClick={onClose}>
        <button className="tricked-modal__close">x</button>
        <YouTube videoId="hvL1339luv0" opts={opts} />
      </div>
    </div>
  )
}

interface TrickedProps {
  open: boolean
  onClose: () => void
}
