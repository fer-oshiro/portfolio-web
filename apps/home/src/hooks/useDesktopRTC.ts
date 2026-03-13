import { useEffect, useRef, useState } from 'react'
import useWebSocket from 'react-use-websocket'

import { WS_URL } from '../service/constants'
import { WebController } from '../service/WebController'

const roomId = crypto.randomUUID && crypto.randomUUID()
export const useDesktopRTC = () => {
  const [connected, setConnected] =
    useState<RTCPeerConnectionState>('disconnected')
  const [gyro, setGyro] = useState({ alpha: 0, beta: 0, gamma: 0 })
  const webController = useRef<WebController | null>(null)
  const { sendJsonMessage, lastJsonMessage } = useWebSocket(
    `${WS_URL}?role=desktop&roomId=${roomId}`,
    {
      onOpen: () => {
        console.log('✅ WebSocket conectado')
        sendJsonMessage({ action: 'join', roomId: roomId })
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
    async function handleLastMessage() {
      if (!lastJsonMessage) return
      const msg = lastJsonMessage as any

      if (msg.type === 'peer-joined') {
        console.log('📱 Mobile detectado:', msg.connectionId)
        const controller = setupPeerConnection(msg.connectionId)
        const offer = await controller.createOffer()
        sendJsonMessage({
          action: 'offer',
          sdp: offer,
          targetConnectionId: msg.connectionId,
          roomId,
        })
      }

      if (msg.type === 'answer') {
        webController.current?.handleRemoteDescription(msg.sdp)
      }

      if (msg.type === 'ice-candidate') {
        webController.current?.addIceCandidate(msg.candidate)
      }
    }
    handleLastMessage()
  }, [lastJsonMessage])

  return { connected, gyro, roomId }
}
