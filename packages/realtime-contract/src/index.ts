import { z } from 'zod'

export const deviceRoleSchema = z.enum(['desktop', 'mobile'])

export const iceServerSchema = z
  .object({
    credential: z.string().optional(),
    urls: z.union([z.string(), z.array(z.string())]),
    username: z.string().optional(),
  })
  .passthrough()

const sessionDescriptionSchema = z.object({
  type: z.enum(['answer', 'offer', 'pranswer', 'rollback']),
  sdp: z.string().max(32_768),
})

const iceCandidateSchema = z.object({
  type: z.literal('candidate'),
  candidate: z.object({
    candidate: z.string().max(2_048),
    sdpMLineIndex: z.number().nullable().optional(),
    sdpMid: z.string().nullable().optional(),
    usernameFragment: z.string().nullable().optional(),
  }),
})

export const signalDataSchema = z.union([
  sessionDescriptionSchema,
  iceCandidateSchema,
])

export const peerSchema = z.object({
  connectionId: z.string().min(1).max(128),
  role: deviceRoleSchema,
})

export const clientMessageSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('join'),
    roomId: z.string().min(1).max(64),
    role: deviceRoleSchema,
  }),
  z.object({
    action: z.literal('signal'),
    targetConnectionId: z.string().min(1).max(128),
    signal: signalDataSchema,
  }),
  z.object({
    action: z.literal('chat'),
    message: z.string().min(1).max(150),
  }),
  z.object({
    action: z.literal('get_drawings'),
  }),
  z.object({
    action: z.literal('save_drawing'),
    name: z.string().trim().min(1).max(60),
  }),
])

export const serverMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('joined'),
    iceServers: z.array(iceServerSchema),
    peers: z.array(peerSchema),
  }),
  z.object({
    type: z.literal('peer_joined'),
    peer: peerSchema,
  }),
  z.object({
    type: z.literal('signal'),
    fromConnectionId: z.string().min(1),
    signal: signalDataSchema,
  }),
  z.object({
    type: z.literal('chat_chunk'),
    text: z.string(),
  }),
  z.object({
    type: z.literal('chat_done'),
  }),
  z.object({
    type: z.literal('drawings'),
    drawings: z.array(
      z.object({
        id: z.string(),
        url: z.url(),
      }),
    ),
  }),
  z.object({
    type: z.literal('upload_grant'),
    url: z.url(),
    method: z.enum(['POST', 'PUT']),
    fields: z.record(z.string(), z.string()),
    expiresAt: z.iso.datetime(),
    maxBytes: z.number().int().positive(),
  }),
  z.object({
    type: z.literal('upload_url'),
    url: z.url(),
  }),
  z.object({
    type: z.literal('error'),
    source: z.enum(['chat', 'draw', 'security', 'signaling']),
    code: z.enum([
      'INTERNAL_ERROR',
      'INVALID_MESSAGE',
      'INVALID_TARGET',
      'QUOTA_EXCEEDED',
      'ROOM_FULL',
      'ROOM_NOT_READY',
      'SESSION_EXPIRED',
    ]),
    message: z.string(),
    retryAfterSeconds: z.number().int().nonnegative().optional(),
  }),
])

export const gyroscopeDataSchema = z.object({
  alpha: z.number().finite(),
  beta: z.number().finite(),
  gamma: z.number().finite(),
})

export type DeviceRole = z.infer<typeof deviceRoleSchema>
export type IceServer = z.infer<typeof iceServerSchema>
export type SignalData = z.infer<typeof signalDataSchema>
export type Peer = z.infer<typeof peerSchema>
export type ClientMessage = z.infer<typeof clientMessageSchema>
export type ServerMessage = z.infer<typeof serverMessageSchema>
export type GyroscopeData = z.infer<typeof gyroscopeDataSchema>
export type Drawing = Extract<
  ServerMessage,
  { type: 'drawings' }
>['drawings'][number]

export type ClientMessageOf<T extends ClientMessage['action']> = Extract<
  ClientMessage,
  { action: T }
>

export type ServerMessageOf<T extends ServerMessage['type']> = Extract<
  ServerMessage,
  { type: T }
>
