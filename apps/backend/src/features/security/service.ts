import type {
  QuotaAction,
  QuotaLimits,
  QuotaRepository,
  SessionContext,
} from './types'
import { SessionExpiredError } from './types'

export interface ConsumeInput {
  action: QuotaAction
  requestId: string
  session: SessionContext
}

export class SecurityService {
  constructor(
    private readonly repository: QuotaRepository,
    private readonly limits: QuotaLimits,
    private readonly now: () => number = Date.now,
  ) {}

  async consume(input: ConsumeInput): Promise<void> {
    const now = this.now()
    if (input.session.expiresAt <= now) throw new SessionExpiredError()

    await this.repository.consume({
      ...input.session,
      action: input.action,
      limits: this.limits,
      now,
      requestId: input.requestId,
    })
  }
}
