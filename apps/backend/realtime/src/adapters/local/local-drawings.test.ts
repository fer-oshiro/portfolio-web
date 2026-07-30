import assert from 'node:assert/strict'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterEach, describe, it } from 'node:test'

import {
  createLocalHttpRequestListener,
  LocalDrawingStorage,
} from './local-drawings'

const SVG = '<svg xmlns="http://www.w3.org/2000/svg"><circle r="4"/></svg>'
const servers: Server[] = []

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((error) => {
            if (error) reject(error)
            else resolve()
          })
        }),
    ),
  )
})

describe('LocalDrawingStorage', () => {
  it('uploads, lists and serves SVG from memory', async () => {
    let baseUrl = ''
    const storage = new LocalDrawingStorage({
      getPublicBaseUrl: () => baseUrl,
    })
    const server = createServer(createLocalHttpRequestListener(storage))
    servers.push(server)
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject)
      server.listen(0, '127.0.0.1', resolve)
    })
    const { port } = server.address() as AddressInfo
    baseUrl = `http://127.0.0.1:${port}`

    const { url } = await storage.createUpload('  meu desenho.svg ')
    assert.deepEqual(await storage.list(), [])

    const upload = await fetch(url, {
      method: 'PUT',
      body: SVG,
      headers: { 'content-type': 'image/svg+xml' },
    })
    assert.equal(upload.status, 204)
    assert.deepEqual(await storage.list(), [{ id: 'meu desenho', url }])

    const drawing = await fetch(url)
    assert.equal(drawing.status, 200)
    assert.equal(drawing.headers.get('content-type'), 'image/svg+xml')
    assert.equal(await drawing.text(), SVG)
  })

  it('rejects unknown uploads and non-SVG content', async () => {
    let baseUrl = ''
    const storage = new LocalDrawingStorage({
      getPublicBaseUrl: () => baseUrl,
    })
    const server = createServer(createLocalHttpRequestListener(storage))
    servers.push(server)
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject)
      server.listen(0, '127.0.0.1', resolve)
    })
    const { port } = server.address() as AddressInfo
    baseUrl = `http://127.0.0.1:${port}`

    const { url } = await storage.createUpload('teste')
    const invalidType = await fetch(url, {
      method: 'PUT',
      body: 'not svg',
      headers: { 'content-type': 'text/plain' },
    })
    assert.equal(invalidType.status, 415)

    const missing = await fetch(
      `${baseUrl}/drawings/00000000-0000-0000-0000-000000000000.svg`,
      {
        method: 'PUT',
        body: SVG,
        headers: { 'content-type': 'image/svg+xml' },
      },
    )
    assert.equal(missing.status, 404)
  })
})
