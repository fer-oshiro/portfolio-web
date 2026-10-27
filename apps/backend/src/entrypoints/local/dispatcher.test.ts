import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { ServerMessage } from '@fer-oshiro/realtime-contract'

import {
  LocalMessageDispatcher,
  type LocalDispatcherDependencies,
} from './dispatcher'

const createDependencies = () => {
  const calls: string[] = []
  const messages: ServerMessage[] = []

  const dependencies: LocalDispatcherDependencies = {
    chat: {
      respond: async ({ connectionId, message }) => {
        calls.push(`chat:${connectionId}:${message}`)
      },
    },
    drawing: {
      createUpload: async (connectionId, name) => {
        calls.push(`save_drawing:${connectionId}:${name}`)
      },
      list: async (connectionId) => {
        calls.push(`get_drawings:${connectionId}`)
      },
    },
    publisher: {
      send: async (_connectionId, message) => {
        messages.push(message)
      },
    },
    signaling: {
      disconnect: async (connectionId) => {
        calls.push(`disconnect:${connectionId}`)
      },
      join: async ({ connectionId, role, roomId }) => {
        calls.push(`join:${connectionId}:${roomId}:${role}`)
      },
      signal: async ({ connectionId, targetConnectionId }) => {
        calls.push(`signal:${connectionId}:${targetConnectionId}`)
      },
    },
  }

  return { calls, dependencies, messages }
}

describe('LocalMessageDispatcher', () => {
  it('validates messages before dispatching them', async () => {
    const { calls, dependencies, messages } = createDependencies()
    const dispatcher = new LocalMessageDispatcher(dependencies)

    await dispatcher.dispatch('connection-1', '{')

    assert.deepEqual(calls, [])
    assert.deepEqual(messages, [
      {
        type: 'error',
        source: 'signaling',
        code: 'INVALID_MESSAGE',
        message: 'Mensagem WebSocket inválida.',
      },
    ])
  })

  it('dispatches every client action to its feature', async () => {
    const { calls, dependencies } = createDependencies()
    const dispatcher = new LocalMessageDispatcher(dependencies)

    await dispatcher.dispatch(
      'connection-1',
      JSON.stringify({ action: 'join', roomId: 'room-1', role: 'desktop' }),
    )
    await dispatcher.dispatch(
      'connection-1',
      JSON.stringify({
        action: 'signal',
        targetConnectionId: 'connection-2',
        signal: { type: 'offer', sdp: 'v=0' },
      }),
    )
    await dispatcher.dispatch(
      'connection-1',
      JSON.stringify({ action: 'chat', message: 'Olá' }),
    )
    await dispatcher.dispatch(
      'connection-1',
      JSON.stringify({ action: 'get_drawings' }),
    )
    await dispatcher.dispatch(
      'connection-1',
      JSON.stringify({ action: 'save_drawing', name: 'desenho.svg' }),
    )
    await dispatcher.disconnect('connection-1')

    assert.deepEqual(calls, [
      'join:connection-1:room-1:desktop',
      'signal:connection-1:connection-2',
      'chat:connection-1:Olá',
      'get_drawings:connection-1',
      'save_drawing:connection-1:desenho.svg',
      'disconnect:connection-1',
    ])
  })

  it('answers heartbeat pings without calling features', async () => {
    const { calls, dependencies, messages } = createDependencies()
    const dispatcher = new LocalMessageDispatcher(dependencies)

    await dispatcher.dispatch(
      'connection-1',
      JSON.stringify({ action: 'ping' }),
    )

    assert.deepEqual(calls, [])
    assert.deepEqual(messages, [{ type: 'pong' }])
  })

  it('translates feature failures to protocol errors', async () => {
    const { dependencies, messages } = createDependencies()
    dependencies.chat.respond = async () => {
      throw new Error('provider unavailable')
    }
    const dispatcher = new LocalMessageDispatcher(dependencies)

    await dispatcher.dispatch(
      'connection-1',
      JSON.stringify({ action: 'chat', message: 'Olá' }),
    )

    assert.deepEqual(messages, [
      {
        type: 'error',
        source: 'chat',
        code: 'INTERNAL_ERROR',
        message: 'Não foi possível responder agora.',
      },
    ])
  })
})
