import React from 'react'
import { colors } from '@fer-oshiro/ui'
import { getContrast } from 'polished'

import './ColorsGrid.css'

export function ColorsGrid() {
  return (
    <div className="colors-grid">
      {Object.entries(colors).map(([group, shades]) => (
        <div key={group}>
          <h1>{group}</h1>
          {Object.entries(shades).map(([key, color]) => (
            <div
              key={key}
              className={`colors-grid__swatch colors-grid__swatch--${group}-${key}`}
            >
              <div
                className={`colors-grid__label ${
                  getContrast(color.value, '#FFF') < 3.5
                    ? 'colors-grid__label--dark'
                    : 'colors-grid__label--light'
                }`}
              >
                <strong>${key}</strong>
                <span>{color.value}</span>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
