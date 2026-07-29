import YouTube from 'react-youtube'
import { useStore } from '../store'

export const Tricked = () => {
  const { tricked, opts, setTricked } = useStore()
  if (!tricked) return <></>
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
        onClick={() => setTricked(false)}
      />
      <div
        style={{
          backgroundColor: '#eee',
          padding: '40px',
          zIndex: 9999,
          position: 'relative',
        }}
        onClick={() => setTricked(false)}
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
