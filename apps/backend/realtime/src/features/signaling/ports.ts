import type { IceServer } from '@fer-oshiro/realtime-contract'

import type { MessagePublisher } from '../../ports/message-publisher'
import type { Connection } from './types'

export interface ConnectionRepository {
  findById(connectionId: string): Promise<Connection | null>
  findByRoom(roomId: string): Promise<Connection[]>
  remove(connectionId: string): Promise<void>
  save(connection: Connection): Promise<void>
}

export interface TurnProvider {
  getIceServers(): Promise<IceServer[]>
}

export interface SignalingDependencies {
  connections: ConnectionRepository
  publisher: MessagePublisher
  turn: TurnProvider
}
