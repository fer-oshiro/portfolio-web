import { useCallback, useEffect, useRef } from 'react'

type TurnstileWidgetOptions = {
  action: string
  appearance: 'interaction-only'
  callback: (token: string) => void
  'error-callback': () => void
  'expired-callback': () => void
  execution: 'execute'
  sitekey: string
  theme: 'auto'
}

type TurnstileApi = {
  execute(widgetId: string): void
  remove(widgetId: string): void
  render(container: HTMLElement, options: TurnstileWidgetOptions): string
  reset(widgetId: string): void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

let turnstileScript: Promise<TurnstileApi> | null = null

const loadTurnstile = () => {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  if (turnstileScript) return turnstileScript

  turnstileScript = new Promise<TurnstileApi>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-portfolio-turnstile]',
    )
    const script = existing ?? document.createElement('script')

    const handleLoad = () => {
      if (window.turnstile) resolve(window.turnstile)
      else reject(new Error('Turnstile API unavailable'))
    }
    script.addEventListener('load', handleLoad, { once: true })
    script.addEventListener(
      'error',
      () => reject(new Error('Could not load Turnstile')),
      { once: true },
    )

    if (!existing) {
      script.src =
        'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      script.defer = true
      script.dataset.portfolioTurnstile = 'true'
      document.head.appendChild(script)
    }
  })

  return turnstileScript
}

type PendingChallenge = {
  reject(error: Error): void
  resolve(token: string): void
}

export const useTurnstileChallenge = (siteKey?: string) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<TurnstileApi | null>(null)
  const pendingRef = useRef<PendingChallenge | null>(null)
  const widgetIdRef = useRef<string | null>(null)

  const executePendingChallenge = useCallback(() => {
    const api = apiRef.current
    const widgetId = widgetIdRef.current
    if (!api || !widgetId || !pendingRef.current) return

    api.reset(widgetId)
    api.execute(widgetId)
  }, [])

  useEffect(() => {
    if (!siteKey || !containerRef.current) return
    let disposed = false

    void loadTurnstile()
      .then((api) => {
        if (disposed || !containerRef.current) return
        apiRef.current = api
        widgetIdRef.current = api.render(containerRef.current, {
          action: 'realtime-connect',
          appearance: 'interaction-only',
          callback: (token) => {
            pendingRef.current?.resolve(token)
            pendingRef.current = null
          },
          'error-callback': () => {
            pendingRef.current?.reject(new Error('Turnstile challenge failed'))
            pendingRef.current = null
          },
          'expired-callback': executePendingChallenge,
          execution: 'execute',
          sitekey: siteKey,
          theme: 'auto',
        })
        executePendingChallenge()
      })
      .catch((error: unknown) => {
        pendingRef.current?.reject(
          error instanceof Error ? error : new Error(String(error)),
        )
        pendingRef.current = null
      })

    return () => {
      disposed = true
      pendingRef.current?.reject(new Error('Turnstile challenge cancelled'))
      pendingRef.current = null
      if (apiRef.current && widgetIdRef.current) {
        apiRef.current.remove(widgetIdRef.current)
      }
      apiRef.current = null
      widgetIdRef.current = null
    }
  }, [executePendingChallenge, siteKey])

  const getChallengeToken = useCallback(() => {
    if (!siteKey) return Promise.resolve<string | null>(null)
    pendingRef.current?.reject(new Error('Turnstile challenge replaced'))

    return new Promise<string | null>((resolve, reject) => {
      pendingRef.current = { reject, resolve }
      executePendingChallenge()
    })
  }, [executePendingChallenge, siteKey])

  return { containerRef, getChallengeToken }
}
