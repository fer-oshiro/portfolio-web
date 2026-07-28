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
