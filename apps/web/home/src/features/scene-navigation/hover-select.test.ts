import { describe, expect, it } from 'vitest'

import {
  HOVER_SELECT_SECONDS,
  isInsideRect,
  stepHoverProgress,
} from './hover-select'

describe('stepHoverProgress', () => {
  it('enche em HOVER_SELECT_SECONDS', () => {
    expect(HOVER_SELECT_SECONDS).toBe(1.2)
    expect(stepHoverProgress(0, true, 0.6)).toBeCloseTo(0.5)
    expect(stepHoverProgress(0, true, 1.2)).toBe(1)
  })

  it('esvazia no mesmo ritmo', () => {
    expect(stepHoverProgress(1, false, 0.6)).toBeCloseTo(0.5)
    expect(stepHoverProgress(1, false, 1.2)).toBe(0)
  })

  it('limita o progresso a [0, 1]', () => {
    expect(stepHoverProgress(0.9, true, 1)).toBe(1)
    expect(stepHoverProgress(0.1, false, 1)).toBe(0)
    expect(stepHoverProgress(0, false, 0.5)).toBe(0)
  })
})

describe('isInsideRect', () => {
  const rect = { left: 10, top: 20, right: 110, bottom: 60 }

  it('inclui o interior e as bordas', () => {
    expect(isInsideRect({ x: 50, y: 40 }, rect)).toBe(true)
    expect(isInsideRect({ x: 10, y: 20 }, rect)).toBe(true)
    expect(isInsideRect({ x: 110, y: 60 }, rect)).toBe(true)
  })

  it('exclui pontos fora do retângulo', () => {
    expect(isInsideRect({ x: 9, y: 40 }, rect)).toBe(false)
    expect(isInsideRect({ x: 111, y: 40 }, rect)).toBe(false)
    expect(isInsideRect({ x: 50, y: 19 }, rect)).toBe(false)
    expect(isInsideRect({ x: 50, y: 61 }, rect)).toBe(false)
  })
})
