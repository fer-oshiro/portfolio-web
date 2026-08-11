import type {
  ClientMessageOf,
  DeviceRole,
  IceServer,
  SignalData,
} from '@fer-oshiro/realtime-contract'

export interface Connection {
  connectionId: string
  iceServers: IceServer[]
  role: DeviceRole
  roomId: string
}

export interface JoinInput extends Omit<ClientMessageOf<'join'>, 'action'> {
  connectionId: string
}

export interface SignalInput {
  connectionId: string
  signal: SignalData
  targetConnectionId: string
}
