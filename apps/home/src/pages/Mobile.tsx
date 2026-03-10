import { useEffect, useRef, useState } from 'react'
import useWebSocket from 'react-use-websocket'
import { WS_URL } from '../service/constants'
import { MobileReceiver } from '../service/MobileReceiver'

const ROOM_ID = '123'
let lastSend = 0

export const Mobile = () => {
  const [connected, setConnected] = useState(false)
  const [status, setStatus] = useState('idle')
  const [giroscopio, setGiroscopio] = useState<any>()
  const [msg1, setMsg] = useState<string[]>([])

  const mobileReceiver = useRef<MobileReceiver | null>(null)
  const desktopId = useRef<string | null>(null)

  const { sendJsonMessage, lastJsonMessage } = useWebSocket(
    `${WS_URL}?role=mobile&roomId=${ROOM_ID}`,
    {
      onOpen: () => {
        setMsg((prev) => [...prev, '✅ WebSocket conectado'])
        setStatus('websocket conectado')
        sendJsonMessage({ action: 'join', roomId: ROOM_ID })
      },
    },
  )

  const handleOffer = async (msg: any) => {
    setStatus('offer recebido')
    try {
      desktopId.current = msg.from
      const receiver = new MobileReceiver(
        () => {},
        (state) => {
          const isConnected = state === 'connected'
          setConnected(isConnected)
        },
        (log) => setMsg((prev) => [...prev, log]),
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
      setMsg((prev) => [
        ...prev,
        `Error: ${e?.message || e?.name || String(e)}`,
      ])
      setStatus('ERRO: ' + (e?.message || String(e)))
    }
  }

  useEffect(() => {
    if (!lastJsonMessage) return
    const msg = lastJsonMessage as any

    if (msg.type === 'peer-joined') {
      setMsg((prev) => [...prev, `🖥️ Desktop detectado: ${msg.connectionId}`])
      desktopId.current = msg.connectionId
    }

    if (msg.type === 'offer') handleOffer(msg)

    if (msg.type === 'ice-candidate') {
      mobileReceiver.current?.addIceCandidate(msg.candidate)
    }
  }, [lastJsonMessage])

  const startGyroscope = () => {
    setStatus('startGyroscope')
    const handleMotion = (event: DeviceOrientationEvent) => {
      const now = Date.now()
      if (now - lastSend < 32) return
      lastSend = now

      const receiver = mobileReceiver.current
      if (receiver?.dc?.readyState === 'open') {
        const payload = {
          alpha: event.alpha,
          beta: event.beta,
          gamma: event.gamma,
        }
        setGiroscopio(payload)
        receiver.send(payload)
      }
    }
    window.addEventListener('deviceorientation', handleMotion)
  }

  const requestPermission = async () => {
    setStatus('ask permission')
    if (
      typeof (DeviceOrientationEvent as any).requestPermission === 'function'
    ) {
      try {
        const permission = await (
          DeviceOrientationEvent as any
        ).requestPermission()
        setStatus(permission)
        if (permission === 'granted') startGyroscope()
      } catch (e: any) {
        setStatus('Permissão Negada')
        setMsg((prev) => [
          ...prev,
          `Error: ${e?.message || e?.name || String(e)}`,
        ])
      }
    } else {
      startGyroscope()
    }
  }

  const handleFakeInput = () => {
    const receiver = mobileReceiver.current
    if (receiver?.dc?.readyState === 'open') {
      const payload = { alpha: 20, beta: 20, gamma: 20 }
      setGiroscopio(payload)
      receiver.send(payload)
    }
  }

  return (
    <div style={{ padding: 20, textAlign: 'center' }}>
      <h2>Controle Mobile</h2>
      <p>Status: {connected ? '🟢 P2P Ativo' : '🔴 Conectando...'}</p>

      <button
        onClick={requestPermission}
        style={{ padding: '15px 30px', fontSize: 18 }}
      >
        Ativar Giroscópio
      </button>

      <p style={{ paddingTop: '20px' }}>{status}</p>
      <p>{JSON.stringify(lastJsonMessage)}</p>
      <p style={{ padding: '30px' }}>{JSON.stringify(giroscopio)}</p>
      <p>
        DeviceOrientationEvent: {JSON.stringify(window.DeviceOrientationEvent)}
      </p>
      <p>{JSON.stringify(msg1)}</p>

      <button style={{ paddingTop: '20px' }} onClick={handleFakeInput}>
        hellloooo
      </button>
    </div>
  )
}
