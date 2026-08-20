import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { TurnstileVerifier } from './turnstile'

const options = {
  action: 'realtime-connect',
  hostname: 'fer-oshiro.com',
  secretKey: 'secret',
}

describe('TurnstileVerifier', () => {
  it('validates the token server-side and checks hostname and action', async () => {
    let requestBody = ''
    const verifier = new TurnstileVerifier(options, async (_url, init) => {
      requestBody = String(init?.body)
      return Response.json({
        action: 'realtime-connect',
        hostname: 'fer-oshiro.com',
        success: true,
      })
    })

    assert.equal(await verifier.verify('challenge-token', '203.0.113.10'), true)
    const parameters = new URLSearchParams(requestBody)
    assert.equal(parameters.get('secret'), 'secret')
    assert.equal(parameters.get('response'), 'challenge-token')
    assert.equal(parameters.get('remoteip'), '203.0.113.10')
  })

  it('fails closed for mismatches, oversized tokens, and provider errors', async () => {
    const mismatch = new TurnstileVerifier(options, async () =>
      Response.json({
        action: 'different-action',
        hostname: 'fer-oshiro.com',
        success: true,
      }),
    )
    const unavailable = new TurnstileVerifier(options, async () => {
      throw new Error('network unavailable')
    })

    assert.equal(await mismatch.verify('token'), false)
    assert.equal(await mismatch.verify('x'.repeat(2_049)), false)
    assert.equal(await unavailable.verify('token'), false)
  })
})
