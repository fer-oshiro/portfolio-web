import {
  GetItemCommand,
  PutItemCommand,
  type DynamoDBClient,
} from '@aws-sdk/client-dynamodb'
import assert from 'node:assert/strict'
import test from 'node:test'

import { DynamoDbTurnCredentialStore } from './dynamodb-turn-credentials'

const credential = {
  expiresAt: 21_601_000,
  iceServers: [{ urls: 'turn:example.test', username: 'u', credential: 'c' }],
  issuedAt: 1_000,
}

class FakeClient {
  item?: Record<string, unknown>
  readonly commands: unknown[] = []

  async send(command: GetItemCommand | PutItemCommand) {
    this.commands.push(command)
    if (command instanceof PutItemCommand) {
      this.item = command.input.Item
      return {}
    }
    return { Item: this.item }
  }
}

const createStore = () => {
  const client = new FakeClient()
  const store = new DynamoDbTurnCredentialStore(
    'turn-credentials',
    client as unknown as DynamoDBClient,
  )
  return { client, store }
}

test('round-trips the shared credential with a DynamoDB TTL', async () => {
  const { client, store } = createStore()

  assert.equal(await store.find(), null)
  await store.save(credential)

  assert.deepEqual(client.item?.expiresAt, { N: '21601' })
  assert.deepEqual(await store.find(), credential)
})

test('ignores a malformed stored credential', async () => {
  const { client, store } = createStore()
  client.item = { id: { S: 'shared' }, iceServers: { S: '{' } }

  assert.equal(await store.find(), null)
})
