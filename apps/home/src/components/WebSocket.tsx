import { useProgress } from '@react-three/drei'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'

import { ReadyState } from 'react-use-websocket'
import github from '../assets/github.png'
import linkedin from '../assets/linkedin.png'
import { useDesktopRTC } from '../hooks/useDesktopRTC'
import { useStore } from '../store'
import { QRCode } from './QRCode'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const WebSocket = () => {
  const { status, setConnected, focus, setCamera } = useStore()
  const { progress } = useProgress()
  const { roomId, gyro, connected, iceServers, readyState } = useDesktopRTC()
  const [isOpen, setIsOpen] = useState<boolean>(true)
  const [background, setBackground] = useState(true)
  console.log(gyro)

  useEffect(() => {
    if (connected === 'connected') {
      setIsOpen(false)
      setConnected(true)
    }
  }, [connected])

  useEffect(() => {
    if (progress === 100 && readyState === ReadyState.OPEN) {
      wait(3000).then(() => setBackground(false))
    }
  }, [progress, readyState])

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100%',
        width: '100%',
        zIndex: 99999999999,
        pointerEvents: 'none',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <AnimatePresence mode="wait">
        {['pc', 'board'].includes(focus) && (
          <motion.div
            style={{
              position: 'fixed',
              top: '40px',
              width: '100px',
              height: '40px',
              backgroundColor: '#e6b092',
              display: 'flex',
              flexDirection: 'column',
              gap: '5px',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              pointerEvents: 'auto',
            }}
            initial={{ left: '-80px' }}
            animate={{ left: '40px' }}
            exit={{ left: '-100px' }}
          >
            <button
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                background: 'none',
              }}
              onClick={() => setCamera('default')}
            >
              Voltar
            </button>
          </motion.div>
        )}
      </AnimatePresence>
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
      <motion.div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          top: 0,
          backgroundColor: '#603e33',
        }}
        initial={{ opacity: '100%' }}
        animate={{ opacity: background === false ? '0%' : '100%' }}
        transition={{ duration: 5 }}
      />
      {isOpen && (
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
          {readyState === ReadyState.OPEN && (
            <div>
              <h1>Bem-vindo ao meu quarto ( ദ്ദി ˙ᗜ˙ )</h1>
              <p>Me chamo Fernanda, sou desenvolvedora Front-end</p>
              <p>
                Esse é meu portfolio, e se sinta a vontade a explorar o meu
                quarto
              </p>
              <p>Para uma melhor experiencia aponte a camera pro QRCode</p>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {iceServers ? <QRCode roomId={roomId} /> : <p>Carregando...</p>}
              </div>
              <p>
                Caso queira saber mais sobre mim de uma forma rápida, acesse as
                minhas redes sociais.
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
                Parece que o nosso servidor está passando por instabilidades no
                momento. Já estou trabalhando para resolver isso o mais rápido
                possível
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
                  <img src={github} style={{ width: '46px', height: '46px' }} />
                </a>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
