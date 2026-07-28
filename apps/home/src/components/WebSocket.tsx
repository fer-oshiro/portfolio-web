import { Button } from '@charmbyte/ui'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { ReadyState } from 'react-use-websocket'

import github from '../assets/github.png'
import linkedin from '../assets/linkedin.png'
import { useDesktopRTC } from '../hooks/useDesktopRTC'
import { useGyro } from '../hooks/useGyro'
import { useStore } from '../store'
import { Cursor } from './Cursor/Cursor'
import { QRCode } from './QRCode'

export const WebSocket = () => {
  const { status, setConnected, setGyro, setCursorPosition } = useStore()
  const { roomId, gyro, connected, iceServers, readyState } = useDesktopRTC()
  const [isOpen, setIsOpen] = useState<boolean>(true)
  const { x, y } = useGyro(gyro)

  useEffect(() => {
    if (connected === 'connected') {
      setIsOpen(false)
      setConnected(true)
    }
  }, [connected])

  useEffect(() => {
    setGyro(gyro)
    setCursorPosition({ x, y })
  }, [x, y])

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100%',
        width: '100%',
        zIndex: 99998,
        pointerEvents: 'none',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {connected === 'connected' && <Cursor />}
      {!isOpen && (
        <button
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            width: '60px',
            height: '60px',
            backgroundColor: '#e6b092',
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '5px',
            border: 'none',
            cursor: 'pointer',
            pointerEvents: 'auto',
          }}
          onClick={() => setIsOpen(true)}
        >
          {[1, 2, 3].map((value) => (
            <span
              key={value}
              style={{
                width: '80%',
                height: '5px',
                backgroundColor: 'black',
                opacity: '70%',
                borderRadius: '20px',
              }}
            />
          ))}
        </button>
      )}

      {isOpen && (
        <>
          <div
            style={{
              pointerEvents: 'all',
              position: 'fixed',
              top: 0,
              left: 0,
              height: '10000px',
              width: '10000px',
              opacity: '60%',
              backgroundColor: 'black',
            }}
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            layout
            style={{
              width: '500px',
              margin: '20px',
              backgroundColor: '#e6b092',
              borderRadius: '20px',
              padding: '20px',
              position: 'relative',
              pointerEvents: 'auto',
              minHeight: '500px',
            }}
          >
            <button
              style={{
                position: 'absolute',
                padding: '5px 10px',
                borderRadius: '15px',
                top: '-10px',
                right: '-10px',
              }}
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
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
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
                <ul
                  style={{
                    margin: '10px 0',
                    padding: 0,
                    listStyle: 'none',
                    display: 'flex',
                    gap: '20px',
                  }}
                >
                  <li>
                    <a
                      href="https://www.linkedin.com/in/fernanda-oshiro/"
                      target="_blank"
                      style={{ width: '46px', height: '46px' }}
                    >
                      <img
                        src={linkedin}
                        style={{ width: '46px', height: '46px' }}
                      />
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://github.com/fer-oshiro/"
                      target="_blank"
                      style={{ width: '46px', height: '46px' }}
                    >
                      <img
                        src={github}
                        style={{ width: '46px', height: '46px' }}
                      />
                    </a>
                  </li>
                </ul>
              </div>
            )}
            {status === 'server_error' && (
              <div>
                <h1>
                  Vish... <span style={{ margin: '0 30px' }}>(๑-﹏-๑)</span>
                </h1>
                <p>
                  Parece que o nosso servidor está passando por instabilidades
                  no momento. Já estou trabalhando para resolver isso o mais
                  rápido possível
                </p>
                <p>Enquanto isso, que tal me acompanhar nas redes sociais?</p>
                <div>
                  <a
                    href="https://www.linkedin.com/in/fernanda-oshiro/"
                    target="_blank"
                    style={{ width: '46px', height: '46px' }}
                  >
                    <img
                      src={linkedin}
                      style={{ width: '46px', height: '46px' }}
                    />
                  </a>
                  <a
                    href="https://github.com/fer-oshiro/"
                    target="_blank"
                    style={{ width: '46px', height: '46px' }}
                  >
                    <img
                      src={github}
                      style={{ width: '46px', height: '46px' }}
                    />
                  </a>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </div>
  )
}
