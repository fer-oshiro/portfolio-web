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

export const Desktop = () => {
  const [gyro, setGyro] = useState({ alpha: 0, beta: 0, gamma: 0 })
  const [connected, setConnected] = useState(false)

  const peerConnection = useRef<RTCPeerConnection | null>(null)
  const dataChannel = useRef<RTCDataChannel | null>(null)
  const remoteDescriptionSet = useRef(false)
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([])

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
    remoteDescriptionSet.current = false
    pendingCandidates.current = []

    const pc = new RTCPeerConnection({ iceServers })

    const dc = pc.createDataChannel('gyro-data', {
      ordered: false,
      maxRetransmits: 0,
    })
    dataChannel.current = dc

    dc.onopen = () => {
      console.log('🎉 DataChannel aberto!')
      setConnected(true)
    }
    dc.onclose = () => setConnected(false)
    dc.onmessage = (e) => {
      try {
        setGyro(JSON.parse(e.data))
      } catch (err) {
        console.error('Erro ao processar giroscópio:', err)
      }
    }

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        sendJsonMessage({
          action: 'iceCandidate',
          candidate,
          targetConnectionId: mobileConnectionId,
        })
      }
    }

    pc.onconnectionstatechange = () => {
      console.log('Estado da conexão:', pc.connectionState)
    }
    pc.oniceconnectionstatechange = () => {
      console.log('Estado do ICE:', pc.iceConnectionState)
    }

    peerConnection.current = pc
    return pc
  }

  useEffect(() => {
    if (!lastJsonMessage) return
    const msg = lastJsonMessage as any

    if (msg.type === 'peer-joined') {
      console.log('📱 Mobile detectado:', msg.connectionId)
      const pc = setupPeerConnection(msg.connectionId)

      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          sendJsonMessage({
            action: 'offer',
            sdp: pc.localDescription,
            targetConnectionId: msg.connectionId,
            roomId: ROOM_ID,
          })
          console.log('📤 Offer enviado')
        })
    }

    if (msg.type === 'answer') {
      const pc = peerConnection.current
      if (!pc) return

      pc.setRemoteDescription(new RTCSessionDescription(msg.sdp)).then(() => {
        remoteDescriptionSet.current = true
        pendingCandidates.current.forEach((cand) =>
          pc.addIceCandidate(new RTCIceCandidate(cand)),
        )
        pendingCandidates.current = []
        console.log('✅ P2P Handshake finalizado')
      })
    }

    if (msg.type === 'ice-candidate') {
      const pc = peerConnection.current
      if (!pc || !remoteDescriptionSet.current) {
        pendingCandidates.current.push(msg.candidate)
      } else {
        pc.addIceCandidate(new RTCIceCandidate(msg.candidate)).catch(
          console.error,
        )
      }
    }
  }, [lastJsonMessage])

  return (
    <div style={{ padding: 20 }}>
      <h2>Desktop (WebRTC)</h2>
      <p>
        Status: {connected ? '🟢 P2P Conectado' : '🔴 Aguardando mobile...'}
      </p>
      {connected && (
        <div style={{ fontSize: '1.5rem', background: '#f0f0f0', padding: 20 }}>
          <p>Alpha: {gyro.alpha?.toFixed(2)}°</p>
          <p>Beta: {gyro.beta?.toFixed(2)}°</p>
          <p>Gamma: {gyro.gamma?.toFixed(2)}°</p>
        </div>
      )}
    </div>
  )
}
