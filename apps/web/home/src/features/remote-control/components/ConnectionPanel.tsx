import { Button } from '@fer-oshiro/ui'
import { motion } from 'motion/react'
import { useCallback, useEffect, useState } from 'react'
import { ReadyState } from 'react-use-websocket'
import { useStore } from 'zustand'

import { useDesktopRTC } from '../hooks/use-desktop-rtc'
import { useGyro } from '../hooks/use-gyro'
import { remoteControlStore } from '../remote-control-store'
import { Cursor } from './RemoteCursor'
import { QRCode } from './RoomQRCode'
import { SocialLinks } from './SocialLinks'

import './ConnectionPanel.css'

export const WebSocket = () => {
  const status = useStore(remoteControlStore, (state) => state.status)
  const setConnected = useStore(
    remoteControlStore,
    (state) => state.setConnected,
  )
  const setCursorPosition = useStore(
    remoteControlStore,
    (state) => state.setCursorPosition,
  )
  const [isOpen, setIsOpen] = useState<boolean>(true)
  const { handleGyro, resetCalibration } = useGyro(setCursorPosition)
  const handleConnectionStateChange = useCallback(
    (connectionState: RTCPeerConnectionState) => {
      const isConnected = connectionState === 'connected'

      if (remoteControlStore.getState().connected !== isConnected) {
        setConnected(isConnected)
      }
      if (isConnected) {
        resetCalibration()
        setIsOpen(false)
      }
    },
    [resetCalibration, setConnected],
  )
  const { roomId, connected, iceServers, readyState } = useDesktopRTC(
    handleGyro,
    handleConnectionStateChange,
  )

  useEffect(() => {
    if (!isOpen) return

    // Capture phase runs before the scene "Voltar" Escape listeners, so the
    // modal closes without also navigating back
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      setIsOpen(false)
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [isOpen])

  return (
    <div className="connection-panel-layer">
      {connected === 'connected' && <Cursor />}
      {!isOpen && (
        <button
          className="connection-panel-menu"
          onClick={() => setIsOpen(true)}
        >
          {[1, 2, 3].map((value) => (
            <span key={value} className="connection-panel-menu__line" />
          ))}
        </button>
      )}

      {isOpen && (
        <>
          <div
            className="connection-panel-backdrop"
            onClick={() => setIsOpen(false)}
          />
          <motion.div layout className="connection-panel">
            <button
              className="connection-panel__close"
              onClick={() => setIsOpen(false)}
            >
              x
            </button>
            {readyState === ReadyState.OPEN && status !== 'server_error' && (
              <div>
                <h1>Bem-vindo ao meu quarto ( ദ്ദി ˙ᗜ˙ )</h1>
                <p>Me chamo Fernanda, sou desenvolvedora Front-end</p>
                <p>
                  Esse é meu portfolio, e se sinta a vontade a explorar o meu
                  quarto
                </p>
                <Button type="button" onClick={() => setIsOpen(false)}>
                  Começar a explorar
                </Button>
                <p>Para uma melhor experiencia aponte a camera pro QRCode</p>
                <div className="connection-panel__qr-code">
                  {iceServers ? (
                    <QRCode roomId={roomId} />
                  ) : (
                    <p>Carregando...</p>
                  )}
                </div>
                <p>
                  Caso queira saber mais sobre mim de uma forma rápida, acesse
                  as minhas redes sociais.
                </p>
                <SocialLinks />
              </div>
            )}
            {status === 'server_error' && (
              <div>
                <h1>
                  Vish...{' '}
                  <span className="connection-panel__error-face">(๑-﹏-๑)</span>
                </h1>
                <p>
                  Parece que o nosso servidor está passando por instabilidades
                  no momento. Já estou trabalhando para resolver isso o mais
                  rápido possível
                </p>
                <p>Enquanto isso, que tal me acompanhar nas redes sociais?</p>
                <SocialLinks layout="inline" />
              </div>
            )}
          </motion.div>
        </>
      )}
    </div>
  )
}
