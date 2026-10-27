import type { IceServer } from '@fer-oshiro/realtime-contract'

import type { MessagePublisher } from '../../ports/message-publisher'
import type { Connection } from './types'

export interface ConnectionRepository {
  findById(connectionId: string): Promise<Connection | null>
  findByRoom(roomId: string): Promise<Connection[]>
  remove(connectionId: string): Promise<void>
  save(connection: Connection): Promise<void>
}

export interface TurnCredential {
  expiresAt: number
  iceServers: IceServer[]
  issuedAt: number
}

export interface TurnProvider {
  issueCredential(): Promise<TurnCredential>
}

/** One credential shared by every room, so a visit does not cost a TURN. */
export interface TurnCredentialStore {
  find(): Promise<TurnCredential | null>
  save(credential: TurnCredential): Promise<void>
}

export interface SignalingDependencies {
  connections: ConnectionRepository
  now?: () => number
  publisher: MessagePublisher
  turn: TurnProvider
  turnCredentials: TurnCredentialStore
}
