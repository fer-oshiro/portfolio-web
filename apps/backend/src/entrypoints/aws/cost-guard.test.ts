import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { APIGatewayProxyEventV2 } from 'aws-lambda'
import twilio from 'twilio'

import { createCostGuardHandler } from './cost-guard'

const webhookUrl = 'https://example.execute-api.test/twilio/usage'
const authToken = 'subaccount-auth-token'
const subaccountSid = 'AC00000000000000000000000000000000'

const triggerEvent = (
  overrides: Record<string, string> = {},
): APIGatewayProxyEventV2 => {
  const parameters = {
    AccountSid: subaccountSid,
    IdempotencyToken: 'event-1',
    Recurring: 'daily',
    TriggerBy: 'price',
    TriggerValue: '2',
    UsageCategory: 'totalprice',
    ...overrides,
  }
  const signature = twilio.getExpectedTwilioSignature(
    authToken,
    webhookUrl,
    parameters,
  )

  return {
    body: new URLSearchParams(parameters).toString(),
    headers: { 'x-twilio-signature': signature },
    isBase64Encoded: false,
    requestContext: { http: { method: 'POST' } },
  } as unknown as APIGatewayProxyEventV2
}

describe('Twilio cost guard', () => {
  it('suspends the dedicated subaccount once at the daily threshold', async () => {
    const notifications: string[] = []
    let suspended = 0
    const handler = createCostGuardHandler({
      claimEvent: async () => true,
      notify: async (message) => {
        notifications.push(message)
      },
      subaccountAuthToken: authToken,
      subaccountSid,
      suspendSubaccount: async () => {
        suspended += 1
      },
      webhookUrl,
    })

    const result = await handler(triggerEvent())

    assert.equal(typeof result, 'object')
    if (typeof result !== 'object' || result === null) assert.fail()
    assert.equal(result.statusCode, 204)
    assert.equal(suspended, 1)
    assert.equal(notifications.length, 1)
  })

  it('rejects unsigned requests before claiming or suspending', async () => {
    let claimed = 0
    const handler = createCostGuardHandler({
      claimEvent: async () => {
        claimed += 1
        return true
      },
      notify: async () => undefined,
      subaccountAuthToken: authToken,
      subaccountSid,
      suspendSubaccount: async () => undefined,
      webhookUrl,
    })
    const unsigned = triggerEvent()
    unsigned.headers['x-twilio-signature'] = 'invalid'

    const result = await handler(unsigned)

    assert.equal(typeof result, 'object')
    if (typeof result !== 'object' || result === null) assert.fail()
    assert.equal(result.statusCode, 403)
    assert.equal(claimed, 0)
  })

  it('only alerts at the configured monthly threshold', async () => {
    let notified = 0
    let suspended = 0
    const handler = createCostGuardHandler({
      claimEvent: async () => true,
      notify: async () => {
        notified += 1
      },
      subaccountAuthToken: authToken,
      subaccountSid,
      suspendSubaccount: async () => {
        suspended += 1
      },
      webhookUrl,
    })

    const result = await handler(
      triggerEvent({ Recurring: 'monthly', TriggerValue: '5' }),
    )

    assert.equal(typeof result, 'object')
    if (typeof result !== 'object' || result === null) assert.fail()
    assert.equal(result.statusCode, 204)
    assert.equal(notified, 1)
    assert.equal(suspended, 0)
  })
})
