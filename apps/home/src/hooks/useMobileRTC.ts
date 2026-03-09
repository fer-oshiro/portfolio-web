import { useEffect, useRef, useState } from 'react'
import { WebRTCEngine } from '../service/WebRTCEngine'
import { useSignaling } from './useSignaling'

export const useMobileRTC = (url: string) => {
  const [connected, setConnected] = useState(false)
  const engine = useRef<WebRTCEngine | null>(null)
  const { signal, send } = useSignaling(url) // O mesmo hook de sinalização

  useEffect(() => {
    if (!signal) return

    const handle = async () => {
      switch (signal.type) {
        case 'offer':
          // 1. Cria o motor quando recebe o offer
          engine.current = new WebRTCEngine(() => {}, setConnected)

          // 2. Configura o ICE para enviar de volta pro Desktop
          engine.current.pc.onicecandidate = (e) => {
            if (e.candidate)
              send('iceCandidate', {
                candidate: e.candidate,
                targetConnectionId: signal.from,
              })
          }

          // 3. Gera o Answer e envia
          const answer = await engine.current.createAnswer(signal.sdp)
          send('answer', { sdp: answer, targetConnectionId: signal.from })
          break

        case 'ice-candidate':
          await engine.current?.addIce(signal.candidate)
          break
      }
    }
    handle()
  }, [signal])

  const sendGyro = (data: any) => {
    if (engine.current?.dc?.readyState === 'open') {
      engine.current.dc.send(JSON.stringify(data))
    }
  }

  return { connected, sendGyro }
}
