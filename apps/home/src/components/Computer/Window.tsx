import { useControls } from 'leva'
import { useEffect, useRef, useState } from 'react'
import useWebSocket from 'react-use-websocket'

import { WS_URL } from '../../service/constants'
import { useStore } from '../../store'
import { TypingDots } from './TypingDots'

import './Window.css'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const splitText = (text = '', maxLength = 200) => {
  const sentences = text.split(/(?<=[.!?])\s+/) // separa após pontuação + espaço
  const chunks = []
  let current = ''

  for (const sentence of sentences) {
    if ((current + sentence).length > maxLength) {
      if (current) chunks.push(current.trim())
      current = sentence
    } else {
      current += ' ' + sentence
    }
  }

  if (current) chunks.push(current.trim())
  return chunks
}

interface IMessage {
  from: string
  text: string
}

interface IWebsocket {
  from?: string
  type: 'chunk' | 'done' | 'error'
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
  const { sendJsonMessage, lastJsonMessage } = useWebSocket<IWebsocket>(
    WS_URL,
    { share: true },
  )
  const { maxChars } = useControls({ maxChars: 150 })
  const [text, setText] = useState('')
  const [waiting, setWaiting] = useState(false)
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
      handleBotDone()
    }
    if (
      lastJsonMessage?.type === 'error' ||
      lastJsonMessage?.message === 'Internal server error'
    ) {
      setBuffer('')
      setWaiting(false)
      setTimeout(function () {
        bottomRef.current?.scrollIntoView()
        inputRef.current?.focus()
      }, 100)
    }
  }, [lastJsonMessage])

  const handleBotDone = async () => {
    for (const text of splitText(buffer)) {
      await handleAddBotMessage(text, splitText(buffer).at(-1))
    }
    setBuffer('')
    setWaiting(false)
    setTimeout(function () {
      bottomRef.current?.scrollIntoView()
      inputRef.current?.focus()
    }, 100)
  }

  const handleAddBotMessage = async (mess: string, lastMess?: string) => {
    setMess((prev) => [
      ...prev,
      {
        from: 'ai',
        text: mess,
      },
    ])
    await wait(300)
    bottomRef.current?.scrollIntoView()
    if (mess !== lastMess) await wait(4000)
  }

  const handleSubmit = () => {
    if (waiting) return
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
    setWaiting(true)
    sendJsonMessage({
      action: 'chat',
      message: text,
    })
    setText('')
  }

  return (
    <div className="window-container">
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
        {waiting && <TypingDots />}
        <div ref={bottomRef}></div>
      </div>
      <div className="textarea-wrapper">
        <textarea
          ref={inputRef}
          value={text}
          maxLength={maxChars}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit()
            }
          }}
          onChange={(event) =>
            event.target.value.length - 1 < maxChars
              ? setText(event.target.value)
              : null
          }
          disabled={waiting}
        />
        <span>
          {maxChars - text.length} / {maxChars} max
        </span>
      </div>
      <button onClick={handleSubmit}>send</button>
    </div>
  )
}
