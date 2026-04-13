import { useEffect, useRef, useState } from 'react'
import useWebSocket, { ReadyState } from 'react-use-websocket'

import { WS_URL } from '../service/constants'
import { MobileReceiver } from '../service/MobileReceiver'

export const useMobileRTC = (onLog: (log: string) => void, roomId: string) => {
  const [connected, setConnected] =
    useState<RTCPeerConnectionState>('disconnected')
  const [gyro, setGyro] = useState({ alpha: 0, beta: 0, gamma: 0 })
  const mobileReceiver = useRef<MobileReceiver | null>(null)
  const desktopId = useRef<string | null>(null)

  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(
    WS_URL,
    { share: true },
  )

  useEffect(() => {
    if (readyState === ReadyState.OPEN) {
      onLog(`✅ WebSocket conectado ${roomId}`)
      sendJsonMessage({ action: 'join', roomId, role: 'mobile' })
    }
  }, [readyState])

  const handleOffer = async (msg: any) => {
    try {
      desktopId.current = msg.from
      const receiver = new MobileReceiver(
        () => {},
        (state) => setConnected(state),
        onLog,
      )

      receiver.pc.onicecandidate = ({ candidate }) => {
        if (candidate) {
          sendJsonMessage({
            action: 'iceCandidate',
            candidate,
            targetConnectionId: msg.from,
          })
        }
      }

      mobileReceiver.current = receiver
      const answer = await receiver.createAnswer(msg.sdp)
      sendJsonMessage({
        action: 'answer',
        sdp: answer,
        targetConnectionId: msg.from,
      })
    } catch (e: any) {
      onLog(`Error: ${e?.message || e?.name || String(e)}`)
      setConnected('failed')
    }
  }

  useEffect(() => {
    if (!lastJsonMessage) return
    const msg = lastJsonMessage as any

    if (msg.type === 'peer-joined') {
      onLog(`🖥️ Desktop detectado: ${msg.connectionId}`)
      desktopId.current = msg.connectionId
    }

    if (msg.type === 'offer') handleOffer(msg)

    if (msg.type === 'ice-candidate') {
      mobileReceiver.current?.addIceCandidate(msg.candidate)
    }

    onLog(lastJsonMessage)
  }, [lastJsonMessage])

  const handleSendGyro = (input: {
    alpha: number | null
    beta: number | null
    gamma: number | null
  }) => {
    const formattedInput = {
      alpha: input.alpha !== null ? Number(input.alpha.toFixed(2)) : gyro.alpha,
      beta: input.beta !== null ? Number(input.beta.toFixed(2)) : gyro.beta,
      gamma: input.gamma !== null ? Number(input.gamma.toFixed(2)) : gyro.gamma,
    }

    setGyro(formattedInput)
    mobileReceiver.current?.send({ ...gyro, ...input })
  }

  return {
    connected,
    gyro,
    handleSendGyro,
    readyState: ReadyState[readyState],
  }
}
