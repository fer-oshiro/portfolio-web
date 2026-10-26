type ToneModule = Pick<typeof import('tone'), 'start' | 'Player'>
type MusicPlayer = InstanceType<ToneModule['Player']>

export type MusicStatus = 'stopped' | 'loading' | 'playing'
export type CatEffect = 'glass' | 'wood'

export type CatAudioDependencies = {
  musicUrl: string
  effectUrls: Record<CatEffect, string>
  effectsVolume: () => number
  loadTone?: () => Promise<ToneModule>
  createAudio?: (src: string) => HTMLAudioElement
  onMusicStatusChange?: (status: MusicStatus) => void
}

export type CatAudioController = ReturnType<typeof createCatAudioController>

// Nothing is imported or instantiated until the first gesture that needs it,
// so preloading the scene never creates or plays audio.
export function createCatAudioController({
  musicUrl,
  effectUrls,
  effectsVolume,
  // webpackExports keeps the dynamic chunk tree-shaken to what is used here.
  loadTone = () => import(/* webpackExports: ["start", "Player"] */ 'tone'),
  createAudio = (src) => new Audio(src),
  onMusicStatusChange,
}: CatAudioDependencies) {
  const effects = new Map<CatEffect, HTMLAudioElement>()
  let musicLoad: Promise<{
    Tone: ToneModule
    player: MusicPlayer
  } | null> | null = null
  let player: MusicPlayer | null = null
  let wantsMusic = false
  let disposed = false
  let status: MusicStatus = 'stopped'

  const setStatus = (next: MusicStatus) => {
    if (status === next) return
    status = next
    onMusicStatusChange?.(next)
  }

  // One load shared by every caller; a failure clears it so a later gesture
  // can retry.
  const loadMusic = () => {
    musicLoad ??= (async () => {
      const Tone = await loadTone()
      const instance = new Tone.Player().toDestination()
      try {
        await instance.load(musicUrl)
      } catch (error) {
        instance.dispose()
        throw error
      }
      if (disposed) {
        instance.dispose()
        return null
      }
      player = instance
      return { Tone, player: instance }
    })().catch(() => {
      musicLoad = null
      return null
    })

    return musicLoad
  }

  const stopMusic = () => {
    wantsMusic = false
    if (player?.state === 'started') player.stop()
    setStatus('stopped')
  }

  const stopAll = () => {
    stopMusic()
    effects.forEach((audio) => {
      if (!audio.paused) audio.pause()
    })
  }

  return {
    async playMusic() {
      if (disposed || status === 'playing') return
      wantsMusic = true
      setStatus('loading')

      const music = await loadMusic()
      if (disposed) return
      // Failed to load, or stopped while loading.
      if (!music || !wantsMusic) {
        wantsMusic = false
        setStatus('stopped')
        return
      }

      await music.Tone.start()
      // Concurrent calls share the load; only the first one starts playback.
      if (!wantsMusic || disposed || music.player.state === 'started') return

      music.player.start()
      setStatus('playing')
    },

    stopMusic,
    stopAll,

    toggleEffect(effect: CatEffect) {
      if (disposed) return

      let audio = effects.get(effect)
      if (!audio) {
        audio = createAudio(effectUrls[effect])
        effects.set(effect, audio)
      }

      if (!audio.paused) {
        audio.pause()
        return
      }

      audio.currentTime = 0
      audio.volume = effectsVolume()
      audio.play().catch(() => {})
    },

    dispose() {
      if (disposed) return
      stopAll()
      disposed = true
      player?.dispose()
      player = null
      effects.clear()
    },
  }
}
