import { useEffect, useRef, useState } from 'react'
import useWebSocket from 'react-use-websocket'

const iceServers = [
  {
    urls: 'stun:global.stun.twilio.com:3478',
  },
  {
    urls: 'turn:global.turn.twilio.com:3478?transport=udp',
    username:
      'f69adc2c108350f4d1f3c1795c09933596fc154ac5d1830be7df739dd4881862',
    credential: 'CkZWEsbTVdmGZSwp7bW154E1zmq23IBe1kGSPhaU4bw=',
  },
  {
    urls: 'turn:global.turn.twilio.com:3478?transport=tcp',
    username:
      'f69adc2c108350f4d1f3c1795c09933596fc154ac5d1830be7df739dd4881862',
    credential: 'CkZWEsbTVdmGZSwp7bW154E1zmq23IBe1kGSPhaU4bw=',
  },
  {
    urls: 'turn:global.turn.twilio.com:443?transport=tcp',
    username:
      'f69adc2c108350f4d1f3c1795c09933596fc154ac5d1830be7df739dd4881862',
    credential: 'CkZWEsbTVdmGZSwp7bW154E1zmq23IBe1kGSPhaU4bw=',
  },
]

const WS_URL = 'wss://6ga2gesq46.execute-api.us-east-1.amazonaws.com/prod'
const ROOM_ID = '123'
let lastSend = 0
export const Mobile = () => {
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState('idle')
  const [giroscopio, setGiroscopio] = useState<any>()
  const [msg1, setMsg] = useState<string[]>([])

  const peerConnection = useRef<RTCPeerConnection | null>(null)
  const dataChannel = useRef<RTCDataChannel | null>(null)
  const desktopId = useRef<string | null>(null)
  const remoteDescriptionSet = useRef(false)
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([])

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
      setMsg((prev) => [...prev, `📩 Offer recebido ${JSON.stringify(msg)}`])
      desktopId.current = msg.from

      remoteDescriptionSet.current = false
      pendingCandidates.current = []

      const pc = new RTCPeerConnection({ iceServers })

      pc.ondatachannel = (event) => {
        dataChannel.current = event.channel
        dataChannel.current.onopen = () => {
          setMsg((prev) => [...prev, '🚀 DataChannel P2P Aberto!'])
          setConnected(true)
          setStatus('p2p conectado')
        }
        dataChannel.current.onclose = () => setConnected(false)
      }

      pc.onicecandidate = ({ candidate }) => {
        if (candidate) {
          sendJsonMessage({
            action: 'iceCandidate',
            candidate,
            targetConnectionId: msg.from,
          })
        }
      }

      peerConnection.current = pc

      await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp))
      remoteDescriptionSet.current = true

      pendingCandidates.current.forEach((cand) =>
        pc.addIceCandidate(new RTCIceCandidate(cand)),
      )
      pendingCandidates.current = []

      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      sendJsonMessage({
        action: 'answer',
        sdp: answer,
        targetConnectionId: msg.from,
      })

      setMsg((prev) => [...prev, '📤 Answer enviado'])
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
      setMsg((prev) => [...prev, `🖥️ Desktop detectado:, ${msg.connectionId}`])
      desktopId.current = msg.connectionId
      // Não faz nada. Aguarda o Desktop mandar o offer.
    }

    if (msg.type === 'offer') {
      handleOffer(msg)
    }

    if (msg.type === 'answer') {
      peerConnection.current?.setRemoteDescription(
        new RTCSessionDescription(msg.sdp),
      )
    }

    if (msg.type === 'ice-candidate') {
      const pc = peerConnection.current
      if (!pc || !remoteDescriptionSet.current) {
        setMsg((prev) => [...prev, '⏳ Candidato ICE guardado no buffer'])
        pendingCandidates.current.push(msg.candidate)
      } else {
        pc.addIceCandidate(new RTCIceCandidate(msg.candidate)).catch(
          console.error,
        )
      }
    }
  }, [lastJsonMessage])

  const startGyroscope = () => {
    setStatus('startGyroscope')
    const handleMotion = (event: DeviceOrientationEvent) => {
      const now = Date.now()
      if (now - lastSend < 32) return
      lastSend = now
      if (dataChannel.current?.readyState === 'open') {
        const payload = {
          alpha: event.alpha,
          beta: event.beta,
          gamma: event.gamma,
        }
        setGiroscopio(payload)
        dataChannel.current.send(JSON.stringify(payload))
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
        if (permission === 'granted') {
          startGyroscope()
        }
      } catch (e) {
        setStatus('Permissão Negada')
        setError('Permissão negada')
      }
    } else {
      startGyroscope()
    }
  }

  const handleFakeInput = () => {
    if (dataChannel.current?.readyState === 'open') {
      const payload = {
        alpha: 20,
        beta: 20,
        gamma: 20,
      }
      setGiroscopio(payload)
      dataChannel.current.send(JSON.stringify(payload))
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

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <p style={{ paddingTop: '20px' }}>{status}</p>
      <p>{JSON.stringify(lastJsonMessage)}</p>
      <p style={{ padding: '30px' }}>{JSON.stringify(giroscopio)}</p>
      <p>DeviceMotionEvent: {JSON.stringify(window.DeviceMotionEvent)}</p>
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
