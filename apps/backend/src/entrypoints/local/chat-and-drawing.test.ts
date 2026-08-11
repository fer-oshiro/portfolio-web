import assert from 'node:assert/strict'
import type { AddressInfo } from 'node:net'
import { afterEach, describe, it } from 'node:test'

import {
  serverMessageSchema,
  type ServerMessage,
} from '@fer-oshiro/realtime-contract'
import { WebSocket } from 'ws'

import { LOCAL_CHAT_RESPONSE } from '../../adapters/local/local-chat'
import { createLocalApplication, type LocalApplication } from '../local'

const applications: LocalApplication[] = []
const sockets: WebSocket[] = []

afterEach(async () => {
  await Promise.all(
    sockets.splice(0).map(
      (socket) =>
        new Promise<void>((resolve) => {
          if (socket.readyState === WebSocket.CLOSED) {
            resolve()
            return
          }

          socket.once('close', resolve)
          socket.close()
        }),
    ),
  )
  await Promise.all(
    applications.splice(0).map((application) => application.close()),
  )
})

const takeMessage = async (
  messages: ServerMessage[],
  type: ServerMessage['type'],
) => {
  const deadline = Date.now() + 2_000

  while (Date.now() < deadline) {
    const index = messages.findIndex((message) => message.type === type)
    if (index >= 0) return messages.splice(index, 1)[0]!
    await new Promise((resolve) => setTimeout(resolve, 5))
  }

  throw new Error(`Timed out waiting for ${type}`)
}

describe('local chat and drawing', () => {
  it('runs both features without secrets or external storage', async () => {
    const application = createLocalApplication({
      host: '127.0.0.1',
      port: 0,
    })
    applications.push(application)
    await application.start()

    const { port } = application.httpServer.address() as AddressInfo
    const socket = new WebSocket(`ws://127.0.0.1:${port}`)
    sockets.push(socket)
    const messages: ServerMessage[] = []
    socket.on('message', (data) => {
      const value: unknown = JSON.parse(data.toString())
      messages.push(serverMessageSchema.parse(value))
    })
    await new Promise<void>((resolve, reject) => {
      socket.once('open', resolve)
      socket.once('error', reject)
    })

    socket.send(JSON.stringify({ action: 'chat', message: 'Olá' }))
    assert.deepEqual(await takeMessage(messages, 'chat_chunk'), {
      type: 'chat_chunk',
      text: LOCAL_CHAT_RESPONSE,
    })
    assert.deepEqual(await takeMessage(messages, 'chat_done'), {
      type: 'chat_done',
    })

    socket.send(
      JSON.stringify({ action: 'save_drawing', name: 'local-test.svg' }),
    )
    const uploadMessage = await takeMessage(messages, 'upload_url')
    assert.equal(uploadMessage.type, 'upload_url')

    const upload = await fetch(uploadMessage.url, {
      method: 'PUT',
      body: '<svg xmlns="http://www.w3.org/2000/svg"/>',
      headers: { 'content-type': 'image/svg+xml' },
    })
    assert.equal(upload.status, 204)

    socket.send(JSON.stringify({ action: 'get_drawings' }))
    const drawingsMessage = await takeMessage(messages, 'drawings')
    assert.deepEqual(drawingsMessage, {
      type: 'drawings',
      drawings: [{ id: 'local-test', url: uploadMessage.url }],
    })
  })
})
