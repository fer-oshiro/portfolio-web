import { iceServerSchema } from '@fer-oshiro/realtime-contract'

import type { TurnCredential, TurnProvider } from '../../features/signaling'

interface TwilioTokenClient {
  tokens: {
    create(input?: { ttl?: number }): Promise<{ iceServers: unknown }>
  }
}

export class TwilioTurnProvider implements TurnProvider {
  constructor(
    private readonly client: TwilioTokenClient,
    private readonly ttlSeconds = 600,
    private readonly now: () => number = Date.now,
  ) {}

  async issueCredential(): Promise<TurnCredential> {
    const issuedAt = this.now()
    const token = await this.client.tokens.create({ ttl: this.ttlSeconds })

    return {
      expiresAt: issuedAt + this.ttlSeconds * 1_000,
      iceServers: iceServerSchema.array().parse(token.iceServers),
      issuedAt,
    }
  }
}
