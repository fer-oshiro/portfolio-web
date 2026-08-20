export type InitialBootPhase = 'pending' | 'running' | 'done'

export type InitialBootEvent =
  { type: 'readinessChanged'; ready: boolean } | { type: 'introFinished' }

export const initialBootPhase: InitialBootPhase = 'pending'

export function transitionInitialBoot(
  phase: InitialBootPhase,
  event: InitialBootEvent,
): InitialBootPhase {
  if (phase === 'done') return phase

  if (event.type === 'introFinished') {
    return phase === 'running' ? 'done' : phase
  }

  if (phase === 'pending' && event.ready) return 'running'

  return phase
}
