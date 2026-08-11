import { PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi'
import type { ServerMessage } from '@fer-oshiro/realtime-contract'
import assert from 'node:assert/strict'
import test from 'node:test'

import { ApiGatewayMessagePublisher } from './api-gateway-publisher'

class RecordingClient {
  readonly commands: PostToConnectionCommand[] = []
  error?: unknown

  async send(command: PostToConnectionCommand): Promise<void> {
    this.commands.push(command)
    if (this.error) throw this.error
  }
}

test('validates and serializes a server message before publishing', async () => {
  const client = new RecordingClient()
  const publisher = new ApiGatewayMessagePublisher(
    'example.execute-api.test',
    'prod',
    client,
  )

  await publisher.send('connection-1', { type: 'chat_done' })

  assert.equal(client.commands.length, 1)
  const command = client.commands[0]
  assert.equal(command?.input.ConnectionId, 'connection-1')
  assert.deepEqual(
    JSON.parse(
      Buffer.from((command?.input.Data ?? []) as Uint8Array).toString(),
    ),
    { type: 'chat_done' },
  )
})

test('rejects an invalid outgoing message before calling API Gateway', async () => {
  const client = new RecordingClient()
  const publisher = new ApiGatewayMessagePublisher('domain', 'stage', client)
  const invalidMessage = {
    type: 'not_in_the_contract',
  } as unknown as ServerMessage

  await assert.rejects(publisher.send('connection-1', invalidMessage))
  assert.equal(client.commands.length, 0)
})

test('ignores a stale API Gateway connection', async () => {
  const client = new RecordingClient()
  client.error = Object.assign(new Error('Gone'), {
    name: 'GoneException',
    $metadata: { httpStatusCode: 410 },
  })
  const publisher = new ApiGatewayMessagePublisher('domain', 'stage', client)
  const originalWarn = console.warn
  console.warn = () => undefined

  try {
    await publisher.send('stale-connection', { type: 'chat_done' })
  } finally {
    console.warn = originalWarn
  }
})

test('propagates unexpected API Gateway errors', async () => {
  const client = new RecordingClient()
  client.error = new Error('Unavailable')
  const publisher = new ApiGatewayMessagePublisher('domain', 'stage', client)

  await assert.rejects(
    publisher.send('connection-1', { type: 'chat_done' }),
    /Unavailable/,
  )
})
