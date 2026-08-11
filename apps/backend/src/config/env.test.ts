import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  loadChatEnvironment,
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
        TABLE_NAME: 'connections',
        TWILIO_ACCOUNT_SID: 'account',
        TWILIO_AUTH_TOKEN: 'token',
      }),
      {
        awsRegion: 'sa-east-1',
        development: true,
        tableName: 'connections',
        twilioAccountSid: 'account',
        twilioAuthToken: 'token',
      },
    )
  })

  it('loads only the settings required by chat', () => {
    assert.deepEqual(loadChatEnvironment({ GROQ_API_KEY: 'key' }), {
      groqApiKey: 'key',
    })
  })

  it('uses the drawing env names shared with Terraform', () => {
    assert.deepEqual(
      loadDrawingEnvironment({
        AWS_REGION: 'us-east-1',
        DRAWINGS_BUCKET: 'drawings',
        DRAWINGS_PUBLIC_BASE_URL: 'https://example.com',
      }),
      {
        awsRegion: 'us-east-1',
        drawingsBucket: 'drawings',
        drawingsPublicBaseUrl: 'https://example.com',
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
