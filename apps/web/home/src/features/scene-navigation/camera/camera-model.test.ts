import { describe, expect, it } from 'vitest'

import {
  getCameraDistance,
  hasCameraArrived,
  initialCameraState,
  selectCameraPose,
  transitionCamera,
} from './camera-model'
import type { CameraPose } from './camera-types'

describe('camera model', () => {
  it('começa na pose de entrada mobile', () => {
    expect(initialCameraState).toEqual({
      focus: 'intro',
      hover: 'default',
      viewport: 'mobile',
    })
    expect(selectCameraPose(initialCameraState)).toEqual({
      coord: [-13.5, 50.5, 7.5],
      target: [0.75, -0.5, -0.3],
    })
  })

  it('deriva a pose do foco e do viewport sem armazenar coordenadas no estado', () => {
    const focused = transitionCamera(initialCameraState, {
      type: 'focusChanged',
      focus: 'board',
    })
    const desktop = transitionCamera(focused, {
      type: 'viewportChanged',
      viewport: 'desktop',
    })

    expect(selectCameraPose(focused)).toEqual({
      coord: [-0.9, 6.6, 0.6],
      target: [3.14, 6.28, 0.39],
    })
    expect(selectCameraPose(desktop)).toEqual({
      coord: [2.19, 6.27, 0.6],
      target: [6.1, 6.3, 0.5],
    })
  })

  it('limpa o hover ao mudar o foco', () => {
    const hovered = transitionCamera(initialCameraState, {
      type: 'hoverChanged',
      hover: 'cat',
    })
    const focused = transitionCamera(hovered, {
      type: 'focusChanged',
      focus: 'cat',
    })

    expect(focused).toEqual({
      focus: 'cat',
      hover: 'default',
      viewport: 'mobile',
    })
  })

  it('ignora eventos que não mudam o modelo', () => {
    expect(
      transitionCamera(initialCameraState, {
        type: 'hoverChanged',
        hover: 'default',
      }),
    ).toBe(initialCameraState)
    expect(
      transitionCamera(initialCameraState, {
        type: 'viewportChanged',
        viewport: 'mobile',
      }),
    ).toBe(initialCameraState)
  })

  it('não altera o estado de entrada', () => {
    const state = { ...initialCameraState }

    transitionCamera(state, {
      type: 'focusChanged',
      focus: 'draw',
    })

    expect(state).toEqual(initialCameraState)
  })
})

describe('camera arrival', () => {
  const destination: CameraPose = {
    coord: [1, 2, 3],
    target: [4, 5, 6],
  }

  it('usa a maior diferença entre posição e target', () => {
    expect(
      getCameraDistance(
        {
          coord: [1.01, 2, 2.8],
          target: [4, 5.1, 6],
        },
        destination,
      ),
    ).toBeCloseTo(0.2)
  })

  it('considera a câmera no destino dentro da tolerância', () => {
    expect(
      hasCameraArrived(
        {
          coord: [1.01, 2, 3],
          target: [4, 5.02, 6],
        },
        destination,
      ),
    ).toBe(true)
    expect(
      hasCameraArrived(
        {
          coord: [1.06, 2, 3],
          target: [4, 5, 6],
        },
        destination,
      ),
    ).toBe(false)
  })
})
