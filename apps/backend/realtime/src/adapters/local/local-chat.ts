import type { ChatProvider } from '../../features/chat'

export const LOCAL_CHAT_RESPONSE =
  'O chat local está funcionando. Configure GROQ_API_KEY para receber respostas da assistente virtual.'

export class LocalChatProvider implements ChatProvider {
  async *stream(): AsyncIterable<string> {
    yield LOCAL_CHAT_RESPONSE
  }
}
