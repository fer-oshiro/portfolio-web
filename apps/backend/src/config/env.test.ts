import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  defaultQuotaLimits,
  loadAuthorizerEnvironment,
  loadChatEnvironment,
  loadCostGuardEnvironment,
  loadDrawingEnvironment,
  loadLocalEnvironment,
  loadSignalingEnvironment,
} from './env'

describe('environment configuration', () => {
  it('loads only the settings required by signaling', () => {
    assert.deepEqual(
      loadSignalingEnvironment({
        AWS_REGION: 'sa-east-1',
        NODE_ENV: 'development',
        QUOTAS_TABLE_NAME: 'quotas',
        TABLE_NAME: 'connections',
        TWILIO_ACCOUNT_SID: 'account',
        TWILIO_AUTH_TOKEN: 'token',
      }),
      {
        awsRegion: 'sa-east-1',
        development: true,
        quotaLimits: defaultQuotaLimits,
        quotasTableName: 'quotas',
        tableName: 'connections',
        turnCredentialTtlSeconds: 600,
        twilioAccountSid: 'account',
        twilioAuthToken: 'token',
      },
    )
  })

  it('loads only the settings required by chat', () => {
    assert.deepEqual(
      loadChatEnvironment({
        AWS_REGION: 'us-east-1',
        GROQ_API_KEY: 'key',
        QUOTAS_TABLE_NAME: 'quotas',
      }),
      {
        awsRegion: 'us-east-1',
        groqApiKey: 'key',
        maxCompletionTokens: 300,
        quotaLimits: defaultQuotaLimits,
        quotasTableName: 'quotas',
      },
    )
  })

  it('uses the drawing env names shared with Terraform', () => {
    assert.deepEqual(
      loadDrawingEnvironment({
        AWS_REGION: 'us-east-1',
        DRAWINGS_BUCKET: 'drawings',
        DRAWINGS_PUBLIC_BASE_URL: 'https://example.com',
        QUOTAS_TABLE_NAME: 'quotas',
      }),
      {
        awsRegion: 'us-east-1',
        drawingsBucket: 'drawings',
        drawingsPublicBaseUrl: 'https://example.com',
        maxUploadBytes: 1_000_000,
        quotaLimits: defaultQuotaLimits,
        quotasTableName: 'quotas',
        uploadExpiresInSeconds: 300,
      },
    )
  })

  it('loads the authorizer limits and Turnstile binding', () => {
    assert.deepEqual(
      loadAuthorizerEnvironment({
        AWS_REGION: 'us-east-1',
        QUOTAS_TABLE_NAME: 'security',
        TURNSTILE_ACTION: 'realtime-connect',
        TURNSTILE_HOSTNAME: 'fer-oshiro.com',
        TURNSTILE_SECRET_KEY: 'secret',
      }),
      {
        awsRegion: 'us-east-1',
        maxDailySessions: 500,
        quotasTableName: 'security',
        sessionTtlSeconds: 7_200,
        turnstileAction: 'realtime-connect',
        turnstileHostname: 'fer-oshiro.com',
        turnstileSecretKey: 'secret',
      },
    )
  })

  it('requires both Twilio account scopes for the cost guard', () => {
    assert.deepEqual(
      loadCostGuardEnvironment({
        AWS_REGION: 'us-east-1',
        NOTIFICATION_TOPIC_ARN: 'arn:aws:sns:us-east-1:123:alerts',
        QUOTAS_TABLE_NAME: 'security',
        TWILIO_PARENT_ACCOUNT_SID: 'parent',
        TWILIO_PARENT_AUTH_TOKEN: 'parent-token',
        TWILIO_SUBACCOUNT_AUTH_TOKEN: 'sub-token',
        TWILIO_SUBACCOUNT_SID: 'subaccount',
        TWILIO_WEBHOOK_URL: 'https://example.test/twilio/usage',
      }),
      {
        awsRegion: 'us-east-1',
        idempotencyTableName: 'security',
        notificationTopicArn: 'arn:aws:sns:us-east-1:123:alerts',
        twilioParentAccountSid: 'parent',
        twilioParentAuthToken: 'parent-token',
        twilioSubaccountAuthToken: 'sub-token',
        twilioSubaccountSid: 'subaccount',
        webhookUrl: 'https://example.test/twilio/usage',
      },
    )
  })

  it('fails early and names a missing setting without exposing other values', () => {
    assert.throws(
      () => loadDrawingEnvironment({ AWS_REGION: 'us-east-1' }),
      /Missing required environment variable: DRAWINGS_BUCKET/,
    )
  })

  it('keeps local secrets optional and applies local defaults', () => {
    assert.deepEqual(loadLocalEnvironment({ PORT: 'invalid' }), {
      groqApiKey: undefined,
      host: '0.0.0.0',
      port: 8080,
    })
  })
})
