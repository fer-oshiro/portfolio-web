import type { IceServer } from '@fer-oshiro/realtime-contract'

import type { TurnProvider } from '../../features/signaling'

export const DEFAULT_LOCAL_ICE_SERVERS: IceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
]

export class LocalTurnProvider implements TurnProvider {
  constructor(
    private readonly primary?: TurnProvider,
    private readonly fallback: IceServer[] = DEFAULT_LOCAL_ICE_SERVERS,
  ) {}

  async getIceServers(): Promise<IceServer[]> {
    if (!this.primary) return this.fallback

    try {
      const iceServers = await this.primary.getIceServers()
      return iceServers.length > 0 ? iceServers : this.fallback
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      console.warn(`TURN local indisponível; usando STUN: ${detail}`)
      return this.fallback
    }
  }
}
