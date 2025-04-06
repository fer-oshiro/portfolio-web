import React from 'react'
import { colors } from '@charmbyte/ui'
import { getContrast } from 'polished'

export function ColorsGrid() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {Object.entries(colors).map(([group, shades]) => (
        <div>
          <h1>{group}</h1>
          {Object.entries(shades).map(([key, color]) => (
            <>
              <div
                key={key}
                style={{ backgroundColor: color.value, padding: '2rem' }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontFamily: 'monospace',
                    color:
                      getContrast(color.value, '#FFF') < 3.5 ? '#000' : '#FFF',
                  }}
                >
                  <strong>${key}</strong>
                  <span>{color.value}</span>
                </div>
              </div>
            </>
          ))}
        </div>
      ))}
    </div>
  )
}
