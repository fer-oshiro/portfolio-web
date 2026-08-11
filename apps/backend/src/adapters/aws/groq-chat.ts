import OpenAI from 'openai'

import { CHAT_SYSTEM_PROMPT, type ChatProvider } from '../../features/chat'

export class GroqChatProvider implements ChatProvider {
  constructor(private readonly client: OpenAI) {}

  async *stream(message: string): AsyncIterable<string> {
    const stream = await this.client.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      stream: true,
      temperature: 0.2,
      messages: [
        { role: 'system', content: CHAT_SYSTEM_PROMPT },
        { role: 'user', content: message },
      ],
    })

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content ?? ''
      if (text) yield text
    }
  }
}
