import { describe, expect, it } from 'vitest'

import { mapGyroToScreen } from './use-gyro'

const viewport = { width: 1920, height: 1080 }

describe('mapGyroToScreen', () => {
  it('mapeia a posição neutra para o centro da tela', () => {
    expect(mapGyroToScreen({ alpha: 0, beta: 15 }, viewport)).toEqual({
      x: 960,
      y: 540,
    })
  })

  it('aceita zero como leitura válida do giroscópio', () => {
    expect(mapGyroToScreen({ alpha: 0, beta: 0 }, viewport)).toEqual({
      x: 960,
      y: 945,
    })
  })

  it('normaliza a volta do alpha e limita a posição à viewport', () => {
    expect(mapGyroToScreen({ alpha: 340, beta: 15 }, viewport).x).toBe(1440)
    expect(mapGyroToScreen({ alpha: 100, beta: 15 }, viewport).x).toBe(0)
    expect(mapGyroToScreen({ alpha: 260, beta: 15 }, viewport).x).toBe(1920)
  })

  it('aplica a calibração nos dois eixos', () => {
    expect(
      mapGyroToScreen({ alpha: 210, beta: 25 }, viewport, {
        alpha: 210,
        beta: 25,
      }),
    ).toEqual({ x: 960, y: 540 })
  })

  it('mantém o deslocamento relativo ao cruzar 360 graus', () => {
    expect(
      mapGyroToScreen({ alpha: 10, beta: 15 }, viewport, {
        alpha: 350,
        beta: 15,
      }).x,
    ).toBe(480)
  })

  it('mantém a sensibilidade proporcional ao tamanho da viewport', () => {
    expect(
      mapGyroToScreen({ alpha: 20, beta: 5 }, { width: 960, height: 540 }),
    ).toEqual({ x: 0, y: 540 })
  })
})
