import { describe, expect, it } from 'vitest'

import { initialBootPhase, transitionInitialBoot } from './initial-boot'

describe('transitionInitialBoot', () => {
  it('aguarda todos os requisitos iniciais da sala', () => {
    expect(
      transitionInitialBoot(initialBootPhase, {
        type: 'readinessChanged',
        ready: false,
      }),
    ).toBe('pending')
  })

  it('inicia a introdução uma única vez quando a sala fica pronta', () => {
    const running = transitionInitialBoot(initialBootPhase, {
      type: 'readinessChanged',
      ready: true,
    })

    expect(running).toBe('running')
    expect(
      transitionInitialBoot(running, {
        type: 'readinessChanged',
        ready: false,
      }),
    ).toBe('running')
  })

  it('ignora novos carregamentos depois que a introdução termina', () => {
    const running = transitionInitialBoot(initialBootPhase, {
      type: 'readinessChanged',
      ready: true,
    })
    const done = transitionInitialBoot(running, { type: 'introFinished' })

    expect(done).toBe('done')
    expect(
      transitionInitialBoot(done, {
        type: 'readinessChanged',
        ready: false,
      }),
    ).toBe('done')
    expect(
      transitionInitialBoot(done, {
        type: 'readinessChanged',
        ready: true,
      }),
    ).toBe('done')
  })

  it('não conclui uma introdução que ainda não começou', () => {
    expect(
      transitionInitialBoot(initialBootPhase, { type: 'introFinished' }),
    ).toBe('pending')
  })
})
