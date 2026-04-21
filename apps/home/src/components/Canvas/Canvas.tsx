import { useEffect, useRef } from 'react'
import { DefaultColorThemePalette, Tldraw } from 'tldraw'

import { Ui, UiHandle } from './Ui'

import { useControls } from 'leva'
import 'tldraw/tldraw.css'

export const Canvas = () => {
  const colors = useControls('Palette', {
    black: DefaultColorThemePalette.lightMode.black.solid,
    grey: DefaultColorThemePalette.lightMode.grey.solid,
    blue: DefaultColorThemePalette.lightMode.blue.solid,
    'light-blue': DefaultColorThemePalette.lightMode['light-blue'].solid,
    green: DefaultColorThemePalette.lightMode.green.solid,
    'light-green': DefaultColorThemePalette.lightMode['light-green'].solid,
    red: DefaultColorThemePalette.lightMode.red.solid,
    'light-red': DefaultColorThemePalette.lightMode['light-red'].solid,
    orange: DefaultColorThemePalette.lightMode.orange.solid,
    yellow: DefaultColorThemePalette.lightMode.yellow.solid,
    violet: DefaultColorThemePalette.lightMode.violet.solid,
    'light-violet': DefaultColorThemePalette.lightMode['light-violet'].solid,
    white: DefaultColorThemePalette.lightMode.white.solid,
  })

  const ui = useRef<UiHandle>(null)

  return (
    <div style={{ display: 'flex', gap: '20px' }}>
      <div
        style={{
          backgroundColor: 'white',
          display: 'grid',
          gridTemplateColumns: 'auto auto',
          gap: '16px',
          padding: '12px',
        }}
      >
        {Object.keys(colors).map((color) => (
          <button
            style={{
              height: '50px',
              width: '50px',
              borderRadius: '50%',
              backgroundColor: colors[color],
              border: '2px solid black',
            }}
            onClick={() => ui.current?.handleColor(color)}
          />
        ))}
      </div>
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
      </div>
      <div
        style={{ height: '500px', width: '500px', backgroundColor: 'white' }}
      >
        <Tldraw
          options={{
            maxPages: 1,
            camera: { isLocked: true },
          }}
          hideUi
        >
          <Ui ref={ui} colors={colors} />
        </Tldraw>
      </div>
    </div>
  )
}
