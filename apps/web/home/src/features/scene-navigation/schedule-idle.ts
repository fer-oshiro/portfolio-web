// Only schedules UI preloading; it never stands in for scene readiness.
export function scheduleIdle(callback: () => void): () => void {
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(callback)
    return () => window.cancelIdleCallback(id)
  }

  const id = window.setTimeout(callback, 1_000)
  return () => window.clearTimeout(id)
}
