import OpenAI from 'openai'

import { CHAT_SYSTEM_PROMPT, type ChatProvider } from '../../features/chat'

export class GroqChatProvider implements ChatProvider {
  constructor(
    private readonly client: OpenAI,
    private readonly maxCompletionTokens = 300,
  ) {}

  async *stream(message: string): AsyncIterable<string> {
    const stream = await this.client.chat.completions.create({
      model: 'openai/gpt-oss-20b',
      reasoning_effort: 'low',
      stream: true,
      temperature: 0.2,
      max_completion_tokens: this.maxCompletionTokens,
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
