import { useControls } from 'leva'
import { useEffect, useRef, useState } from 'react'

import { useRealtime, useRealtimeMessage } from '../../remote-control/realtime'
import { TypingDots } from './TypingDots'

import './AssistantWindow.css'

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

export const AssistantWindow = () => {
  const bottomRef = useRef<HTMLDivElement>(null)
  const [mess, setMess] = useState<IMessage[]>([
    {
      from: 'ai',
      text: 'Olá, eu sou o assistente virtual da Fernanda Oshiro. Como posso ajudar você hoje?',
    },
  ])
  const bufferRef = useRef('')
  const { send } = useRealtime()
  const { maxChars } = useControls({ maxChars: 150 })
  const [text, setText] = useState('')
  const [waiting, setWaiting] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

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

  const handleBotDone = async () => {
    const response = bufferRef.current
    bufferRef.current = ''
    for (const text of splitText(response)) {
      await handleAddBotMessage(text, splitText(response).at(-1))
    }
    setWaiting(false)
    setTimeout(function () {
      bottomRef.current?.scrollIntoView()
      inputRef.current?.focus()
    }, 100)
  }

  useRealtimeMessage('chat_chunk', ({ text }) => {
    bufferRef.current += text
  })
  useRealtimeMessage('chat_done', () => handleBotDone())
  useRealtimeMessage('error', ({ source }) => {
    if (source !== 'chat') return
    bufferRef.current = ''
    setWaiting(false)
    setTimeout(function () {
      bottomRef.current?.scrollIntoView()
      inputRef.current?.focus()
    }, 100)
  })

  const handleSubmit = () => {
    const message = text.trim().slice(0, 150)
    if (waiting || !message) return
    setMess((prev) => [
      ...prev,
      {
        from: 'user',
        text: message,
      },
    ])
    setTimeout(function () {
      bottomRef.current?.scrollIntoView()
    }, 100)
    setWaiting(true)
    send({
      action: 'chat',
      message,
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
