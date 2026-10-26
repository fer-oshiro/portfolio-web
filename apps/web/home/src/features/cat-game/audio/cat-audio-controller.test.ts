import { describe, expect, it, vi } from 'vitest'

import {
  createCatAudioController,
  type CatAudioDependencies,
  type MusicStatus,
} from './cat-audio-controller'

function first<T>(items: T[]): T {
  const [item] = items
  if (!item) throw new Error('expected at least one item')
  return item
}

function deferred<T = void>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function setup({
  loadTone,
  bufferLoad,
}: {
  loadTone?: () => Promise<unknown>
  bufferLoad?: () => Promise<void>
} = {}) {
  const players: FakePlayer[] = []

  class FakePlayer {
    state: 'started' | 'stopped' = 'stopped'
    load = vi.fn(async () => {
      await bufferLoad?.()
      return this
    })
    start = vi.fn(() => {
      this.state = 'started'
    })
    stop = vi.fn(() => {
      this.state = 'stopped'
    })
    dispose = vi.fn()
    toDestination = () => this
    constructor() {
      players.push(this)
    }
  }

  const tone = { start: vi.fn(async () => {}), Player: FakePlayer }
  const audios: FakeAudio[] = []

  class FakeAudio {
    paused = true
    currentTime = 3
    volume = 1
    src: string
    play = vi.fn(() => {
      this.paused = false
      return Promise.resolve()
    })
    pause = vi.fn(() => {
      this.paused = true
    })
    constructor(src: string) {
      this.src = src
      audios.push(this)
    }
  }

  const statuses: MusicStatus[] = []
  const dependencies: CatAudioDependencies = {
    musicUrl: 'music.mp3',
    effectUrls: { glass: 'glass.mp3', wood: 'wood.mp3' },
    effectsVolume: () => 0.7,
    loadTone: (loadTone ??
      (async () => tone)) as CatAudioDependencies['loadTone'],
    createAudio: (src) => new FakeAudio(src) as unknown as HTMLAudioElement,
    onMusicStatusChange: (status) => statuses.push(status),
  }

  return {
    controller: createCatAudioController(dependencies),
    tone,
    players,
    audios,
    statuses,
  }
}

describe('createCatAudioController', () => {
  it('não importa Tone nem cria áudio ao ser criado', () => {
    const loadTone = vi.fn()
    const { audios } = setup({ loadTone })

    expect(loadTone).not.toHaveBeenCalled()
    expect(audios).toHaveLength(0)
  })

  it('dois cliques rápidos em play criam e iniciam um único player', async () => {
    const { controller, players, statuses } = setup()

    await Promise.all([controller.playMusic(), controller.playMusic()])

    expect(players).toHaveLength(1)
    expect(first(players).load).toHaveBeenCalledOnce()
    expect(first(players).start).toHaveBeenCalledOnce()
    expect(statuses).toEqual(['loading', 'playing'])
  })

  it('não reinicia a música que já está tocando', async () => {
    const { controller, players } = setup()

    await controller.playMusic()
    await controller.playMusic()

    expect(first(players).start).toHaveBeenCalledOnce()
  })

  it('stop antes do fim do carregamento impede a música de começar depois', async () => {
    const buffer = deferred()
    const { controller, players, statuses } = setup({
      bufferLoad: () => buffer.promise,
    })

    const playing = controller.playMusic()
    await vi.waitFor(() => expect(players).toHaveLength(1))
    controller.stopMusic()
    buffer.resolve()
    await playing

    expect(first(players).start).not.toHaveBeenCalled()
    expect(statuses.at(-1)).toBe('stopped')
  })

  it('sair da cena interrompe a música e permite tocar de novo ao voltar', async () => {
    const { controller, players } = setup()

    await controller.playMusic()
    controller.stopAll()
    expect(first(players).stop).toHaveBeenCalledOnce()

    await controller.playMusic()
    expect(players).toHaveLength(1)
    expect(first(players).start).toHaveBeenCalledTimes(2)
  })

  it('stop e dispose são idempotentes', async () => {
    const { controller, players } = setup()

    await controller.playMusic()
    controller.stopMusic()
    controller.stopMusic()
    controller.dispose()
    controller.dispose()

    expect(first(players).stop).toHaveBeenCalledOnce()
    expect(first(players).dispose).toHaveBeenCalledOnce()
  })

  it('descarta o player que termina de carregar depois do dispose', async () => {
    const buffer = deferred()
    const { controller, players } = setup({
      bufferLoad: () => buffer.promise,
    })

    const playing = controller.playMusic()
    await vi.waitFor(() => expect(players).toHaveLength(1))
    controller.dispose()
    buffer.resolve()
    await playing

    expect(first(players).start).not.toHaveBeenCalled()
    expect(first(players).dispose).toHaveBeenCalledOnce()
  })

  it('uma falha ao carregar o áudio não rejeita e permite nova tentativa', async () => {
    const tone = deferred<never>()
    const loadTone = vi
      .fn()
      .mockReturnValueOnce(tone.promise)
      .mockImplementation(async () => setup().tone)
    const { controller, statuses } = setup({ loadTone })

    tone.reject(new Error('offline'))
    await expect(controller.playMusic()).resolves.toBeUndefined()
    expect(statuses.at(-1)).toBe('stopped')

    await controller.playMusic()
    expect(loadTone).toHaveBeenCalledTimes(2)
    expect(statuses.at(-1)).toBe('playing')
  })

  it('cria cada efeito no primeiro uso e toca do início', () => {
    const { controller, audios } = setup()

    controller.toggleEffect('glass')

    expect(audios).toHaveLength(1)
    expect(first(audios)).toMatchObject({
      src: 'glass.mp3',
      currentTime: 0,
      volume: 0.7,
      paused: false,
    })

    controller.toggleEffect('glass')
    expect(first(audios).pause).toHaveBeenCalledOnce()

    controller.toggleEffect('glass')
    expect(audios).toHaveLength(1)
  })

  it('captura a rejeição de play() dos efeitos', async () => {
    const { controller, audios } = setup()
    const unhandled = vi.fn()
    process.on('unhandledRejection', unhandled)

    controller.toggleEffect('wood')
    first(audios).play.mockRejectedValueOnce(new Error('NotAllowedError'))
    first(audios).paused = true
    controller.toggleEffect('wood')
    await new Promise((resolve) => setTimeout(resolve, 0))

    process.off('unhandledRejection', unhandled)
    expect(unhandled).not.toHaveBeenCalled()
  })

  it('sair da cena pausa os efeitos em andamento', () => {
    const { controller, audios } = setup()

    controller.toggleEffect('glass')
    controller.stopAll()

    expect(first(audios).pause).toHaveBeenCalledOnce()
  })
})
