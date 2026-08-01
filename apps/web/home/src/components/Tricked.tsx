import YouTube from 'react-youtube'

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
    <div
      style={{
        textAlign: 'center',
        position: 'fixed',
        zIndex: 9999,
        top: 0,
        left: 0,
        height: '100%',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          top: 0,
          left: 0,
          height: '100%',
          width: '100%',
          backgroundColor: 'black',
          opacity: '90%',
          position: 'fixed',
          zIndex: 999,
        }}
        onClick={onClose}
      />
      <div
        style={{
          backgroundColor: '#eee',
          padding: '40px',
          zIndex: 9999,
          position: 'relative',
        }}
        onClick={onClose}
      >
        <button
          style={{
            padding: '15px 20px',
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: '#ddd',
          }}
        >
          x
        </button>
        <YouTube videoId="hvL1339luv0" opts={opts} />
      </div>
    </div>
  )
}

interface TrickedProps {
  open: boolean
  onClose: () => void
}
