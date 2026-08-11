import assert from 'node:assert/strict'
import type { AddressInfo } from 'node:net'
import { afterEach, describe, it } from 'node:test'

import { WebSocket } from 'ws'

import {
  createLocalServer,
  type LocalDispatcher,
  type LocalServer,
} from './local'

const servers: LocalServer[] = []

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => server.close()))
})

describe('createLocalServer', () => {
  it('serves HTTP and WebSocket on the same port', async () => {
    const dispatched: string[] = []
    let disconnected = false
    const dispatcher: LocalDispatcher = {
      dispatch: async (_connectionId, message) => {
        dispatched.push(message)
      },
      disconnect: async () => {
        disconnected = true
      },
    }
    const server = createLocalServer({
      dispatcher,
      host: '127.0.0.1',
      port: 0,
    })
    servers.push(server)
    await server.start()

    const { port } = server.httpServer.address() as AddressInfo
    const response = await fetch(`http://127.0.0.1:${port}/health`)
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { status: 'ok' })

    const socket = new WebSocket(`ws://127.0.0.1:${port}`)
    await new Promise<void>((resolve, reject) => {
      socket.once('open', resolve)
      socket.once('error', reject)
    })
    assert.equal(server.clients.size, 1)
    socket.send(JSON.stringify({ action: 'get_drawings' }))

    await new Promise<void>((resolve) => {
      const deadline = setInterval(() => {
        if (dispatched.length === 0) return
        clearInterval(deadline)
        resolve()
      }, 5)
    })
    socket.close()
    await new Promise<void>((resolve) => socket.once('close', resolve))
    await new Promise<void>((resolve, reject) => {
      const interval = setInterval(() => {
        if (!disconnected) return
        clearInterval(interval)
        clearTimeout(timeout)
        resolve()
      }, 5)
      const timeout = setTimeout(() => {
        clearInterval(interval)
        reject(new Error('Timed out waiting for disconnect'))
      }, 2_000)
    })

    assert.deepEqual(dispatched, ['{"action":"get_drawings"}'])
    assert.equal(disconnected, true)
    assert.equal(server.clients.size, 0)
  })

  it('allows the HTTP handler to be extended for later local adapters', async () => {
    const dispatcher: LocalDispatcher = {
      dispatch: async () => undefined,
      disconnect: async () => undefined,
    }
    const server = createLocalServer({
      dispatcher,
      host: '127.0.0.1',
      port: 0,
      requestListener: (_request, response) => {
        response.writeHead(204)
        response.end()
      },
    })
    servers.push(server)
    await server.start()

    const { port } = server.httpServer.address() as AddressInfo
    const response = await fetch(`http://127.0.0.1:${port}/drawings`)

    assert.equal(response.status, 204)
  })
})
