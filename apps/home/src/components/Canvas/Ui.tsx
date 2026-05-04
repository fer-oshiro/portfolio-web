import { useEffect, useImperativeHandle } from 'react'

import './Ui.css'

export type Color =
  | 'black'
  | 'grey'
  | 'blue'
  | 'light-blue'
  | 'green'
  | 'light-green'
  | 'red'
  | 'light-red'
  | 'violet'
  | 'light-violet'
  | 'orange'
  | 'yellow'
  | 'white'

export interface UiHandle {
  handleErase: () => void
  handleColor: (color: Color) => void
  handleExport: () => Promise<Blob>
  colors: {
    [color in Color]: string
  }
}

export const Ui = ({ ref, colors }) => {
  useImperativeHandle(
    ref,
    () => ({
      handleColor(color: string) {},
      handleErase() {},
      async handleExport() {},
    }),
    [],
  )
  useEffect(() => {
    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Delete':
        case 'Backspace': {
          break
        }
        case 'v': {
          break
        }
        case 'e': {
          break
        }
        case 'x':
        case 'p':
        case 'b':
        case 'd': {
          break
        }
      }
    }

    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keyup', handleKeyUp)
    }
  })

  return <></>
}
