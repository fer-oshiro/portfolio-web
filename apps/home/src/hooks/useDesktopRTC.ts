import { useEffect, useRef, useState } from 'react'
import useWebSocket, { ReadyState } from 'react-use-websocket'

import { WS_URL } from '../service/constants'
import { WebController } from '../service/WebController'

const roomId = crypto.randomUUID && crypto.randomUUID()
export const useDesktopRTC = () => {
  const [connected, setConnected] =
    useState<RTCPeerConnectionState>('disconnected')
  const [gyro, setGyro] = useState({ alpha: 0, beta: 0, gamma: 0 })
  const webController = useRef<WebController | null>(null)
  const [iceServers, setIceServers] = useState<RTCIceServer[]>()
  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(
    WS_URL,
    { share: true },
  )

  useEffect(() => {
    if (readyState === ReadyState.OPEN) {
      console.log(`join ${roomId}`)
      sendJsonMessage({ action: 'join', roomId, role: 'desktop' })
    }
    if (readyState === ReadyState.CLOSED) {
      console.log('disconnected')
    }
  }, [readyState])

  const setupPeerConnection = (mobileConnectionId: string) => {
    if (!iceServers) return
    const controller = new WebController(
      setGyro,
      (state) => setConnected(state),
      console.log,
      iceServers,
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
      console.log(lastJsonMessage)

      if (msg.type === 'ice-servers') {
        setIceServers(msg.iceServers)
      }

      if (msg.type === 'peer-joined') {
        console.log('📱 Mobile detectado:', msg.connectionId)
        const controller = setupPeerConnection(msg.connectionId)
        if (!controller) return
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
