import type { Drawing, ServerMessageOf } from '@fer-oshiro/realtime-contract'

import type { MessagePublisher } from '../../ports/message-publisher'

export interface DrawingStorage {
  list(): Promise<Drawing[]>
  createUpload(
    name: string,
  ): Promise<Omit<ServerMessageOf<'upload_grant'>, 'type'>>
}

export interface DrawingDependencies {
  storage: DrawingStorage
  publisher: MessagePublisher
}
