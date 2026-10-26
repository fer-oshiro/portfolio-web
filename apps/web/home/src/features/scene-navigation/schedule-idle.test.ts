import { afterEach, describe, expect, it, vi } from 'vitest'

import { scheduleIdle } from './schedule-idle'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('scheduleIdle', () => {
  it('usa requestIdleCallback quando disponível e cancela no cleanup', () => {
    const requestIdleCallback = vi.fn(() => 7)
    const cancelIdleCallback = vi.fn()
    vi.stubGlobal('window', { requestIdleCallback, cancelIdleCallback })
    const callback = vi.fn()

    const cancel = scheduleIdle(callback)
    cancel()

    expect(requestIdleCallback).toHaveBeenCalledWith(callback)
    expect(cancelIdleCallback).toHaveBeenCalledWith(7)
  })

  it('recorre a um timeout sem requestIdleCallback', () => {
    vi.useFakeTimers()
    vi.stubGlobal('window', {
      setTimeout: globalThis.setTimeout,
      clearTimeout: globalThis.clearTimeout,
    })
    const callback = vi.fn()

    scheduleIdle(callback)
    vi.advanceTimersByTime(999)
    expect(callback).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(callback).toHaveBeenCalledOnce()
  })

  it('cancela o timeout de fallback no cleanup', () => {
    vi.useFakeTimers()
    vi.stubGlobal('window', {
      setTimeout: globalThis.setTimeout,
      clearTimeout: globalThis.clearTimeout,
    })
    const callback = vi.fn()

    scheduleIdle(callback)()
    vi.advanceTimersByTime(2_000)

    expect(callback).not.toHaveBeenCalled()
  })
})
