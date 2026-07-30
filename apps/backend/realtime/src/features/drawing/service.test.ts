import type { Drawing, ServerMessage } from '@fer-oshiro/realtime-contract'
import assert from 'node:assert/strict'
import test from 'node:test'

import type { MessagePublisher } from '../../ports/message-publisher'
import type { DrawingStorage } from './ports'
import { DrawingService } from './service'

class FakeDrawingStorage implements DrawingStorage {
  readonly uploadNames: string[] = []

  constructor(
    private readonly drawings: Drawing[],
    private readonly uploadUrl: string,
  ) {}

  async list(): Promise<Drawing[]> {
    return this.drawings
  }

  async createUpload(name: string): Promise<{ url: string }> {
    this.uploadNames.push(name)
    return { url: this.uploadUrl }
  }
}

class RecordingPublisher implements MessagePublisher {
  readonly messages: Array<{
    connectionId: string
    message: ServerMessage
  }> = []

  async send(connectionId: string, message: ServerMessage): Promise<void> {
    this.messages.push({ connectionId, message })
  }
}

test('lists drawings using the realtime message format', async () => {
  const drawings = [
    {
      id: 'fernanda',
      url: 'https://fer-oshiro.com/gallery/1-fernanda.svg',
    },
  ]
  const publisher = new RecordingPublisher()
  const service = new DrawingService({
    storage: new FakeDrawingStorage(
      drawings,
      'https://uploads.example.com/drawing',
    ),
    publisher,
  })

  await service.list('connection-1')

  assert.deepEqual(publisher.messages, [
    {
      connectionId: 'connection-1',
      message: { type: 'drawings', drawings },
    },
  ])
})

test('creates an upload and publishes its URL', async () => {
  const storage = new FakeDrawingStorage(
    [],
    'https://uploads.example.com/drawing',
  )
  const publisher = new RecordingPublisher()
  const service = new DrawingService({ storage, publisher })

  await service.createUpload('connection-1', 'novo.svg')

  assert.deepEqual(storage.uploadNames, ['novo.svg'])
  assert.deepEqual(publisher.messages, [
    {
      connectionId: 'connection-1',
      message: {
        type: 'upload_url',
        url: 'https://uploads.example.com/drawing',
      },
    },
  ])
})
