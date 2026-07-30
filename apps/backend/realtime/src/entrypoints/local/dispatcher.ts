import {
  clientMessageSchema,
  type ClientMessage,
} from '@fer-oshiro/realtime-contract'

import type { ChatService } from '../../features/chat'
import type { DrawingService } from '../../features/drawing'
import type { SignalingService } from '../../features/signaling'
import type { MessagePublisher } from '../../ports/message-publisher'

type SignalingOperations = Pick<
  SignalingService,
  'disconnect' | 'join' | 'signal'
>
type ChatOperations = Pick<ChatService, 'respond'>
type DrawingOperations = Pick<DrawingService, 'createUpload' | 'list'>

export interface LocalDispatcherDependencies {
  chat: ChatOperations
  drawing: DrawingOperations
  publisher: MessagePublisher
  signaling: SignalingOperations
}

const errorFor = (
  action: ClientMessage['action'],
): Parameters<MessagePublisher['send']>[1] => {
  if (action === 'chat') {
    return {
      type: 'error',
      source: 'chat',
      code: 'INTERNAL_ERROR',
      message: 'Não foi possível responder agora.',
    }
  }

  if (action === 'get_drawings' || action === 'save_drawing') {
    return {
      type: 'error',
      source: 'draw',
      code: 'INTERNAL_ERROR',
      message: 'Não foi possível processar o desenho.',
    }
  }

  return {
    type: 'error',
    source: 'signaling',
    code: 'INTERNAL_ERROR',
    message: 'Erro interno no servidor.',
  }
}

export class LocalMessageDispatcher {
  constructor(private readonly dependencies: LocalDispatcherDependencies) {}

  async disconnect(connectionId: string): Promise<void> {
    await this.dependencies.signaling.disconnect(connectionId)
  }

  async dispatch(connectionId: string, rawMessage: string): Promise<void> {
    let value: unknown

    try {
      value = JSON.parse(rawMessage)
    } catch {
      value = null
    }

    const parsed = clientMessageSchema.safeParse(value)

    if (!parsed.success) {
      await this.dependencies.publisher.send(connectionId, {
        type: 'error',
        source: 'signaling',
        code: 'INVALID_MESSAGE',
        message: 'Mensagem WebSocket inválida.',
      })
      return
    }

    const message = parsed.data

    try {
      switch (message.action) {
        case 'join':
          await this.dependencies.signaling.join({
            connectionId,
            role: message.role,
            roomId: message.roomId,
          })
          break
        case 'signal':
          await this.dependencies.signaling.signal({
            connectionId,
            signal: message.signal,
            targetConnectionId: message.targetConnectionId,
          })
          break
        case 'chat':
          await this.dependencies.chat.respond({
            connectionId,
            message: message.message,
          })
          break
        case 'get_drawings':
          await this.dependencies.drawing.list(connectionId)
          break
        case 'save_drawing':
          await this.dependencies.drawing.createUpload(
            connectionId,
            message.name,
          )
          break
      }
    } catch (error) {
      console.error(`[local:${message.action}] error:`, error)
      await this.dependencies.publisher.send(
        connectionId,
        errorFor(message.action),
      )
    }
  }
}
