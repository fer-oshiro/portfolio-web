import { useEffect, useImperativeHandle } from 'react'
import {
  DefaultColorStyle,
  DefaultColorThemePalette,
  DefaultDashStyle,
  DefaultSizeStyle,
  track,
  useEditor,
} from 'tldraw'

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

export const Ui = track(({ ref, colors }) => {
  const editor = useEditor()

  DefaultColorThemePalette.lightMode.black.solid = colors.black
  DefaultColorThemePalette.lightMode.blue.solid = colors.blue
  DefaultColorThemePalette.lightMode.green.solid = colors.green
  DefaultColorThemePalette.lightMode.grey.solid = colors.grey
  DefaultColorThemePalette.lightMode.orange.solid = colors.orange
  DefaultColorThemePalette.lightMode.red.solid = colors.red
  DefaultColorThemePalette.lightMode.violet.solid = colors.violet
  DefaultColorThemePalette.lightMode.white.solid = colors.white
  DefaultColorThemePalette.lightMode.yellow.solid = colors.yellow

  useImperativeHandle(
    ref,
    () => ({
      handleColor(color: string) {
        editor.setCurrentTool('draw')
        editor.setStyleForNextShapes(DefaultColorStyle, color)
        editor.setStyleForNextShapes(DefaultDashStyle, 'solid')
        editor.setStyleForNextShapes(DefaultSizeStyle, 'xl')
      },
      handleErase() {
        editor.setCurrentTool('eraser')
      },
      async handleExport() {
        const shapeIds = editor.getCurrentPageShapeIds()
        if (shapeIds.size === 0) return alert('No shapes on the canvas')
        const { blob } = await editor.toImage([...shapeIds], {
          format: 'svg',
          background: false,
        })
        return blob
      },
    }),
    [],
  )
  useEffect(() => {
    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Delete':
        case 'Backspace': {
          editor.deleteShapes(editor.getSelectedShapeIds())
          break
        }
        case 'v': {
          editor.setCurrentTool('select')
          break
        }
        case 'e': {
          editor.setCurrentTool('eraser')
          break
        }
        case 'x':
        case 'p':
        case 'b':
        case 'd': {
          editor.setCurrentTool('draw')
          editor.setStyleForNextShapes(DefaultColorStyle, 'red')
          editor.setStyleForNextShapes(DefaultDashStyle, 'solid')
          editor.setStyleForNextShapes(DefaultSizeStyle, 'xl')
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
})
