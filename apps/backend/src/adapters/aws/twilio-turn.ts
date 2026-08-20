import { iceServerSchema } from '@fer-oshiro/realtime-contract'

import type { TurnProvider } from '../../features/signaling'

interface TwilioTokenClient {
  tokens: {
    create(input?: { ttl?: number }): Promise<{ iceServers: unknown }>
  }
}

export class TwilioTurnProvider implements TurnProvider {
  constructor(
    private readonly client: TwilioTokenClient,
    private readonly ttlSeconds = 600,
  ) {}

  async getIceServers() {
    const token = await this.client.tokens.create({ ttl: this.ttlSeconds })
    return iceServerSchema.array().parse(token.iceServers)
  }
}
