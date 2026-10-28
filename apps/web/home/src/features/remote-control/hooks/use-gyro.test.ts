import { describe, expect, it } from 'vitest'

import { getPointerAngles, mapGyroToScreen } from './use-gyro'

const viewport = { width: 1920, height: 1080 }

const expectPosition = (
  actual: { x: number; y: number },
  expected: { x: number; y: number },
) => {
  expect(actual.x).toBeCloseTo(expected.x)
  expect(actual.y).toBeCloseTo(expected.y)
}

describe('mapGyroToScreen', () => {
  it('mapeia a inclinação para cima e para baixo em faixa fixa', () => {
    const at = (beta: number) =>
      mapGyroToScreen({ alpha: 0, beta }, viewport).position.y

    expect(at(30)).toBeCloseTo(0)
    expect(at(10)).toBeCloseTo(540)
    expect(at(-10)).toBeCloseTo(1080)
    expect(at(60)).toBeCloseTo(0)
    expect(at(-40)).toBeCloseTo(1080)
  })

  it('alcança as laterais com 50 graus em qualquer largura', () => {
    for (const width of [1920, 3440]) {
      const size = { width, height: 1080 }

      expect(
        mapGyroToScreen({ alpha: 310, beta: 10 }, size).position.x,
      ).toBeCloseTo(width)
      expect(
        mapGyroToScreen({ alpha: 50, beta: 10 }, size).position.x,
      ).toBeCloseTo(0)
      expect(
        mapGyroToScreen({ alpha: 0, beta: 10 }, size).position.x,
      ).toBeCloseTo(width / 2)
    }
  })

  it('ignora a virada de Euler quando o celular rola mais de 90 graus', () => {
    expectPosition(
      mapGyroToScreen({ alpha: 180, beta: 170 }, viewport).position,
      mapGyroToScreen({ alpha: 0, beta: 10 }, viewport).position,
    )
    expect(getPointerAngles({ alpha: 200, beta: 160 }).pitch).toBeCloseTo(20)
  })

  it('mantém o deslocamento relativo ao cruzar 360 graus', () => {
    expect(
      mapGyroToScreen({ alpha: 350, beta: 10 }, viewport, 350).position.x,
    ).toBeCloseTo(1344)
  })

  it('arrasta o centro ao passar da borda para não prender o cursor', () => {
    const pastEdge = mapGyroToScreen({ alpha: 270, beta: 10 }, viewport, 0)

    expect(pastEdge.position.x).toBeCloseTo(1920)
    expect(pastEdge.yawCenter).toBeCloseTo(40)

    const back = mapGyroToScreen(
      { alpha: 320, beta: 10 },
      viewport,
      pastEdge.yawCenter,
    )

    expect(back.position.x).toBeCloseTo(960)
    expect(back.yawCenter).toBeCloseTo(40)
  })
})
