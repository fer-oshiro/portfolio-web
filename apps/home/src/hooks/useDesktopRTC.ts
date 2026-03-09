import { useEffect, useRef, useState } from 'react'
import { WebRTCEngine } from '../service/WebRTCEngine'
import { useSignaling } from './useSignaling'

export const useDesktopRTC = (url: string, onData: (data: any) => void) => {
  const [connected, setConnected] = useState(false)
  const engine = useRef<WebRTCEngine | null>(null)
  const { signal, send } = useSignaling(url)

  useEffect(() => {
    if (!signal) return
    const handle = async () => {
      switch (signal.type) {
        case 'peer-joined': {
          const e = new WebRTCEngine(onData, setConnected)
          engine.current = e
          e.pc.onicecandidate = (ev) => {
            if (ev.candidate)
              send('iceCandidate', {
                candidate: ev.candidate,
                targetConnectionId: signal.connectionId,
              })
          }
          e.dc = e.pc.createDataChannel('gyro-data', { ordered: false })
          const offer = await e.createOffer()
          send('offer', { sdp: offer, targetConnectionId: signal.connectionId })
          break
        }
        case 'answer':
          await engine.current?.handleAnswer(signal.sdp)
          break
        case 'ice-candidate':
          await engine.current?.addIce(signal.candidate)
          break
      }
    }
    handle()
  }, [signal])

  return { connected }
}
