import { useEffect, useRef, useState } from 'react'

import { UiHandle } from './Ui'

import { Leva, useControls } from 'leva'
import useWebSocket from 'react-use-websocket'
import { WS_URL } from '../../service/constants'

interface IWebsocket {
  from?: string
  type: 'chunk' | 'done'
  text?: string
}

export const Canvas = () => {
  const [open, setOpen] = useState(false)
  const colors = useControls('Palette', {})
  const { sendJsonMessage, lastJsonMessage } = useWebSocket<IWebsocket>(
    WS_URL,
    { share: true },
  )

  const ui = useRef<UiHandle>(null)

  const handleSave = (e) => {
    e.preventDefault()
    const name = e.currentTarget.elements.name.value
    sendJsonMessage({
      action: 'save_drawing',
      message: name,
    })
  }

  const uploadImg = async (url: string) => {
    const blob = await ui.current?.handleExport()
    console.log(blob)
    if (!blob) return
    await fetch(url, {
      method: 'PUT',
      body: blob,
      headers: {
        'Content-Type': 'image/svg+xml',
      },
    })

    setOpen(false)
  }

  useEffect(() => {
    if (lastJsonMessage?.from === 'url_draw' && lastJsonMessage.text) {
      uploadImg(lastJsonMessage.text)
    }
  }, [lastJsonMessage])

  return (
    <>
      <Leva collapsed />
      <div style={{ display: 'flex', gap: '20px' }}>
        <div
          style={{
            backgroundColor: 'white',
            display: 'grid',
            gridTemplateColumns: 'auto auto',
            gap: '16px',
            padding: '12px',
          }}
        ></div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'self-start' }}>
          <button
            onClick={() => {
              ui.current?.handleColor('black')
            }}
            style={{
              backgroundColor: 'white',
              padding: '12px',
              borderRadius: '12px',
            }}
          >
            lapis
          </button>
          <button
            onClick={() => {
              ui.current?.handleErase()
            }}
            style={{
              backgroundColor: 'white',
              padding: '12px',
              borderRadius: '12px',
            }}
          >
            borracha
          </button>
          <button
            onClick={() => setOpen(true)}
            style={{
              backgroundColor: 'white',
              padding: '12px',
              borderRadius: '12px',
            }}
          >
            save
          </button>
        </div>
        <div
          style={{ height: '500px', width: '500px', backgroundColor: 'white' }}
        ></div>
      </div>

      {open && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            height: '100%',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              position: 'fixed',
              backgroundColor: 'black',
              top: 0,
              left: 0,
              height: '100%',
              width: '100%',
              opacity: '80%',
            }}
            onClick={() => setOpen(false)}
          ></div>
          <form
            style={{
              backgroundColor: 'white',
              width: '50%',
              height: '40%',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
            }}
            onSubmit={handleSave}
          >
            <button
              style={{ marginLeft: 'auto' }}
              onClick={() => setOpen(false)}
            >
              x
            </button>
            <input id="name" />
            <button type="submit">salvar</button>
          </form>
        </div>
      )}
    </>
  )
}
