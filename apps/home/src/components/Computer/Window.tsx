import { useEffect, useRef, useState } from 'react'
import { useStore } from '../../store'
import './Window.css'
import { useControls } from 'leva'

export const Window = () => {
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

  return (
    <div className="window-container">
      sou uma janela
      <div className="chat-container">
        <div className="bubble-container">
          aasasdasd asdasda asdasdada asdasdadd
        </div>
        <div className="bubble-container left-bubble">
          aasasdasd asdasda asdasdada asdasdadd
        </div>
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
    </div>
  )
}
