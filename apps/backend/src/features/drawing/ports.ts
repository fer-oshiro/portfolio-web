import type { Drawing } from '@fer-oshiro/realtime-contract'

import type { MessagePublisher } from '../../ports/message-publisher'

export interface DrawingStorage {
  list(): Promise<Drawing[]>
  createUpload(name: string): Promise<{ url: string }>
}

export interface DrawingDependencies {
  storage: DrawingStorage
  publisher: MessagePublisher
}
