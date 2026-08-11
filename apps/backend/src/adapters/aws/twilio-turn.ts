import { iceServerSchema } from '@fer-oshiro/realtime-contract'

import type { TurnProvider } from '../../features/signaling'

interface TwilioTokenClient {
  tokens: {
    create(): Promise<{ iceServers: unknown }>
  }
}

export class TwilioTurnProvider implements TurnProvider {
  constructor(private readonly client: TwilioTokenClient) {}

  async getIceServers() {
    const token = await this.client.tokens.create()
    return iceServerSchema.array().parse(token.iceServers)
  }
}
