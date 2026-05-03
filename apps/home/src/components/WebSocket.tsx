import { useEffect, useState } from 'react'
import { useDesktopRTC } from '../hooks/useDesktopRTC'
import { QRCode } from './QRCode'

export const WebSocket = () => {
  const { roomId, gyro, connected, iceServers } = useDesktopRTC()
  const [isOpen, setIsOpen] = useState<boolean>(false)
  console.log(gyro, connected)

  useEffect(() => {
    if (connected === 'connected') setIsOpen(false)
  }, [connected])

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100%',
        width: '100%',
        zIndex: 99999999999,
        pointerEvents: 'none',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {isOpen && (
        <div
          style={{
            height: '600px',
            width: '500px',
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '20px',
            position: 'relative',
            pointerEvents: 'auto',
          }}
        >
          <button
            style={{
              position: 'absolute',
              padding: '5px 10px',
              borderRadius: '15px',
              top: '-10px',
              right: '-10px',
            }}
            onClick={() => setIsOpen(false)}
          >
            x
          </button>
          <h1>Meu portfolio :D</h1>
          {iceServers ? <QRCode roomId={roomId} /> : <p>Loading....</p>}
        </div>
      )}
    </div>
  )
}
