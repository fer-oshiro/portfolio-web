import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { defaultQuotaLimits } from '../../config/env'
import { SecurityService } from './service'
import {
  SessionExpiredError,
  type ConsumeQuotaInput,
  type QuotaRepository,
} from './types'

class RecordingQuotas implements QuotaRepository {
  consumed: ConsumeQuotaInput[] = []

  async consume(input: ConsumeQuotaInput): Promise<void> {
    this.consumed.push(input)
  }

  async createSession(): Promise<void> {}
}

describe('SecurityService', () => {
  it('atomically delegates route and total limits with the current time', async () => {
    const quotas = new RecordingQuotas()
    const service = new SecurityService(quotas, defaultQuotaLimits, () => 2_000)

    await service.consume({
      action: 'chat',
      requestId: 'request-1',
      session: { expiresAt: 3_000, sessionId: 'session-1' },
    })

    assert.deepEqual(quotas.consumed, [
      {
        action: 'chat',
        expiresAt: 3_000,
        limits: defaultQuotaLimits,
        now: 2_000,
        requestId: 'request-1',
        sessionId: 'session-1',
      },
    ])
  })

  it('rejects an expired session before consuming quota', async () => {
    const quotas = new RecordingQuotas()
    const service = new SecurityService(quotas, defaultQuotaLimits, () => 2_000)

    await assert.rejects(
      service.consume({
        action: 'chat',
        requestId: 'request-1',
        session: { expiresAt: 2_000, sessionId: 'session-1' },
      }),
      SessionExpiredError,
    )
    assert.equal(quotas.consumed.length, 0)
  })
})
