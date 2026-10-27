import type { IceServer } from '@fer-oshiro/realtime-contract'

import type { TurnCredential, TurnProvider } from '../../features/signaling'

export const DEFAULT_LOCAL_ICE_SERVERS: IceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
]

// STUN has no credential to expire; a day keeps the shared-credential rule
const LOCAL_CREDENTIAL_LIFETIME_MS = 86_400_000

export class LocalTurnProvider implements TurnProvider {
  constructor(
    private readonly primary?: TurnProvider,
    private readonly fallback: IceServer[] = DEFAULT_LOCAL_ICE_SERVERS,
    private readonly now: () => number = Date.now,
  ) {}

  async issueCredential(): Promise<TurnCredential> {
    if (!this.primary) return this.fallbackCredential()

    try {
      const credential = await this.primary.issueCredential()
      return credential.iceServers.length > 0
        ? credential
        : this.fallbackCredential()
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      console.warn(`TURN local indisponível; usando STUN: ${detail}`)
      return this.fallbackCredential()
    }
  }

  private fallbackCredential(): TurnCredential {
    const issuedAt = this.now()
    return {
      expiresAt: issuedAt + LOCAL_CREDENTIAL_LIFETIME_MS,
      iceServers: this.fallback,
      issuedAt,
    }
  }
}
