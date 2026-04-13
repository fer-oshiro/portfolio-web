import { useControls } from 'leva'
import { useEffect, useRef, useState } from 'react'
import useWebSocket from 'react-use-websocket'

import { WS_URL } from '../../service/constants'
import { useStore } from '../../store'
import './Window.css'

interface IMessage {
  from: string
  text: string
}

interface IWebsocket {
  from?: string
  type: 'chunk' | 'done'
  text?: string
}

export const Window = () => {
  const bottomRef = useRef<HTMLDivElement>(null)
  const [mess, setMess] = useState<IMessage[]>([
    {
      from: 'ai',
      text: 'Olá, eu sou o assistente virtual da Fernanda Oshiro. Como posso ajudar você hoje?',
    },
  ])
  const [buffer, setBuffer] = useState('')
  const { sendJsonMessage, lastJsonMessage, readyState } =
    useWebSocket<IWebsocket>(WS_URL, { share: true })
  console.log({ readyState, lastJsonMessage })
  const { maxChars } = useControls({
    maxChars: 150,
  })
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { focus } = useStore()

  useEffect(() => {
    if (focus === 'pc') {
      inputRef.current?.focus()
    }
  }, [focus])

  useEffect(() => {
    if (lastJsonMessage?.from === 'ai' && lastJsonMessage?.type === 'chunk')
      setBuffer((prev) => prev + lastJsonMessage?.text)
    if (lastJsonMessage?.from === 'ai' && lastJsonMessage?.type === 'done') {
      setMess((prev) => [
        ...prev,
        {
          from: 'ai',
          text: buffer,
        },
      ])
      setBuffer('')

      setTimeout(function () {
        bottomRef.current?.scrollIntoView()
      }, 100)
    }
  }, [lastJsonMessage])

  const handleMessage = () => {
    setMess((prev) => [
      ...prev,
      {
        from: 'user',
        text,
      },
    ])
    setTimeout(function () {
      bottomRef.current?.scrollIntoView()
    }, 100)
    sendJsonMessage({
      action: 'chat',
      message: text,
    })
    setText('')
  }

  return (
    <div className="window-container">
      sou uma janela
      <div className="chat-container">
        {mess.map((message, index) => (
          <div
            key={`chat-${index.toString()}`}
            className={
              message.from === 'user'
                ? 'bubble-container left-bubble'
                : 'bubble-container'
            }
          >
            {message.text}
          </div>
        ))}
        <div ref={bottomRef}></div>
      </div>
      <div className="textarea-wrapper">
        <textarea
          ref={inputRef}
          value={text}
          maxLength={maxChars}
          onChange={(event) =>
            event.target.value.length - 1 < maxChars
              ? setText(event.target.value)
              : null
          }
        />
        <span>
          {maxChars - text.length} / {maxChars} max
        </span>
      </div>
      <button onClick={handleMessage}>send</button>
    </div>
  )
}
