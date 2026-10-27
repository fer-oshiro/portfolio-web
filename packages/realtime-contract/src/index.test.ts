import { describe, expect, it } from 'vitest'

import {
  clientMessageSchema,
  gyroscopeDataSchema,
  serverMessageSchema,
} from './index'

describe('realtime contract', () => {
  it('accepts signaling messages', () => {
    expect(
      clientMessageSchema.safeParse({
        action: 'signal',
        targetConnectionId: 'mobile-1',
        signal: { type: 'offer', sdp: 'v=0' },
      }).success,
    ).toBe(true)
    expect(
      serverMessageSchema.safeParse({
        type: 'signal',
        fromConnectionId: 'desktop-1',
        signal: {
          type: 'candidate',
          candidate: {
            candidate: 'candidate:1',
            sdpMid: '0',
            sdpMLineIndex: 0,
          },
        },
      }).success,
    ).toBe(true)
  })

  it('accepts heartbeat messages', () => {
    expect(clientMessageSchema.safeParse({ action: 'ping' }).success).toBe(true)
    expect(serverMessageSchema.safeParse({ type: 'pong' }).success).toBe(true)
  })

  it('rejects unknown and malformed messages', () => {
    expect(
      clientMessageSchema.safeParse({ action: 'offer', sdp: 'v=0' }).success,
    ).toBe(false)
    expect(
      serverMessageSchema.safeParse({
        type: 'joined',
        iceServers: '[]',
        peers: [],
      }).success,
    ).toBe(false)
    expect(
      serverMessageSchema.safeParse({
        type: 'error',
        code: 'INTERNAL_ERROR',
        message: 'Falhou',
      }).success,
    ).toBe(false)
  })

  it('bounds public inputs and validates upload grants', () => {
    expect(
      clientMessageSchema.safeParse({
        action: 'join',
        roomId: 'x'.repeat(65),
        role: 'desktop',
      }).success,
    ).toBe(false)
    expect(
      clientMessageSchema.safeParse({
        action: 'save_drawing',
        name: '   ',
      }).success,
    ).toBe(false)
    expect(
      serverMessageSchema.safeParse({
        type: 'upload_grant',
        url: 'https://uploads.example.com',
        method: 'POST',
        fields: { key: 'submissions/id.svg' },
        expiresAt: '2026-08-11T12:00:00.000Z',
        maxBytes: 1_000_000,
      }).success,
    ).toBe(true)
  })

  it('only accepts complete finite gyroscope data', () => {
    expect(
      gyroscopeDataSchema.safeParse({ alpha: 1, beta: 2, gamma: 3 }).success,
    ).toBe(true)
    expect(
      gyroscopeDataSchema.safeParse({ alpha: 1, beta: null, gamma: 3 }).success,
    ).toBe(false)
    expect(
      gyroscopeDataSchema.safeParse({
        alpha: Number.NaN,
        beta: 2,
        gamma: 3,
      }).success,
    ).toBe(false)
  })
})
