import { useEffect, useRef, useState } from 'react'
import useWebSocket from 'react-use-websocket'
import { WS_URL } from '../service/constants'
import { WebController } from '../service/WebController'

const ROOM_ID = '123'
export const Desktop = () => {
  const [gyro, setGyro] = useState({ alpha: 0, beta: 0, gamma: 0 })
  const [connected, setConnected] =
    useState<RTCPeerConnectionState>('disconnected')

  const webController = useRef<WebController | null>(null)

  const { sendJsonMessage, lastJsonMessage } = useWebSocket(
    `${WS_URL}?role=desktop&roomId=${ROOM_ID}`,
    {
      onOpen: () => {
        console.log('✅ WebSocket conectado')
        sendJsonMessage({ action: 'join', roomId: ROOM_ID })
      },
      onClose: () => console.log('❌ WebSocket desconectado'),
    },
  )

  const setupPeerConnection = (mobileConnectionId: string) => {
    const controller = new WebController(
      setGyro,
      (state) => setConnected(state),
      console.log,
    )

    controller.pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        sendJsonMessage({
          action: 'iceCandidate',
          candidate,
          targetConnectionId: mobileConnectionId,
        })
      }
    }

    webController.current = controller
    return controller
  }

  useEffect(() => {
    if (!lastJsonMessage) return
    const msg = lastJsonMessage as any

    if (msg.type === 'peer-joined') {
      console.log('📱 Mobile detectado:', msg.connectionId)
      const controller = setupPeerConnection(msg.connectionId)

      controller.createOffer().then((offer) => {
        sendJsonMessage({
          action: 'offer',
          sdp: offer,
          targetConnectionId: msg.connectionId,
          roomId: ROOM_ID,
        })
        console.log('📤 Offer enviado')
      })
    }

    if (msg.type === 'answer') {
      webController.current?.handleRemoteDescription(msg.sdp).then(() => {
        console.log('✅ P2P Handshake finalizado')
      })
    }

    if (msg.type === 'ice-candidate') {
      webController.current?.addIceCandidate(msg.candidate)
    }
  }, [lastJsonMessage])

  return (
    <div style={{ padding: 20 }}>
      <h2>Desktop (WebRTC)</h2>
      <p>
        Status:{' '}
        {connected === 'connected'
          ? '🟢 P2P Conectado'
          : '🔴 Aguardando mobile...'}
      </p>
      {connected === 'connected' && (
        <div
          style={{ fontSize: '1.5rem', padding: 20, border: '1px solid white' }}
        >
          <p>Alpha: {gyro.alpha?.toFixed(2)}°</p>
          <p>Beta: {gyro.beta?.toFixed(2)}°</p>
          <p>Gamma: {gyro.gamma?.toFixed(2)}°</p>
        </div>
      )}
    </div>
  )
}
