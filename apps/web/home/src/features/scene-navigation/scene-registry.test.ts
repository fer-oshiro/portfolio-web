import { describe, expect, it, vi } from 'vitest'

import { createSceneRegistry, shouldRequestScene } from './scene-registry'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const module = { Scene: () => null }

describe('createSceneRegistry', () => {
  it('começa sem pedir nenhuma cena', () => {
    const loader = vi.fn(() => Promise.resolve(module))
    const registry = createSceneRegistry({ cat: loader })

    expect(registry.getEntry('cat')).toMatchObject({
      status: 'not-requested',
      attempt: 0,
      promise: null,
      module: null,
    })
    expect(loader).not.toHaveBeenCalled()
  })

  it('reutiliza a mesma Promise enquanto o import está em andamento', () => {
    const pending = deferred<typeof module>()
    const loader = vi.fn(() => pending.promise)
    const registry = createSceneRegistry({ cat: loader })

    const first = registry.load('cat')
    const second = registry.load('cat')

    expect(first).toBe(second)
    expect(loader).toHaveBeenCalledTimes(1)
    expect(registry.getEntry('cat').status).toBe('loading')
  })

  it('mantém o módulo carregado no cache da sessão', async () => {
    const loader = vi.fn(() => Promise.resolve(module))
    const registry = createSceneRegistry({ cat: loader })

    await registry.load('cat')
    await registry.load('cat')

    expect(loader).toHaveBeenCalledTimes(1)
    expect(registry.getEntry('cat')).toMatchObject({
      status: 'loaded',
      module,
    })
  })

  it('limpa a tentativa rejeitada e permite uma nova', async () => {
    const loader = vi
      .fn<() => Promise<typeof module>>()
      .mockRejectedValueOnce(new Error('chunk'))
      .mockResolvedValueOnce(module)
    const registry = createSceneRegistry({ cat: loader })

    const failed = registry.load('cat')
    await expect(failed).rejects.toThrow('chunk')
    expect(registry.getEntry('cat')).toMatchObject({
      status: 'failed',
      attempt: 0,
      promise: failed,
    })

    const retry = registry.load('cat')

    expect(retry).not.toBe(failed)
    expect(registry.getEntry('cat')).toMatchObject({
      status: 'loading',
      attempt: 1,
    })
    await expect(retry).resolves.toBe(module)
    expect(loader).toHaveBeenCalledTimes(2)
  })

  it('expõe um resultado que nunca rejeita para a árvore renderizar', async () => {
    const registry = createSceneRegistry({
      cat: () => Promise.reject(new Error('chunk')),
    })

    registry.preload('cat')
    const { result } = registry.getEntry('cat')

    await expect(result).resolves.toBeNull()
  })

  it('resolve o resultado com o módulo carregado', async () => {
    const registry = createSceneRegistry({
      cat: () => Promise.resolve(module),
    })

    registry.preload('cat')

    await expect(registry.getEntry('cat').result).resolves.toBe(module)
  })

  it('preload não deixa a rejeição sem tratamento', async () => {
    const registry = createSceneRegistry({
      cat: () => Promise.reject(new Error('offline')),
    })

    registry.preload('cat')
    await vi.waitFor(() =>
      expect(registry.getEntry('cat').status).toBe('failed'),
    )
  })

  it('avisa os assinantes a cada mudança e mantém o snapshot estável', async () => {
    const registry = createSceneRegistry({
      cat: () => Promise.resolve(module),
    })
    const listener = vi.fn()
    const unsubscribe = registry.subscribe(listener)
    const initial = registry.getEntry('cat')

    expect(registry.getEntry('cat')).toBe(initial)

    await registry.load('cat')

    expect(listener).toHaveBeenCalledTimes(2)
    unsubscribe()
    registry.load('cat')
    expect(listener).toHaveBeenCalledTimes(2)
  })
})

describe('shouldRequestScene', () => {
  it.each([
    ['not-requested', true, true],
    ['failed', true, true],
    ['loading', true, false],
    ['loaded', true, false],
    ['not-requested', false, false],
    ['failed', false, false],
  ] as const)('status %s com destino=%s → %s', (status, targeted, expected) => {
    expect(shouldRequestScene(status, targeted)).toBe(expected)
  })
})
