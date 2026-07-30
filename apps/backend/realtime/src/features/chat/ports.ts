import type { MessagePublisher } from '../../ports/message-publisher'

export interface ChatProvider {
  stream(message: string): AsyncIterable<string>
}

export interface ChatDependencies {
  provider: ChatProvider
  publisher: MessagePublisher
}
