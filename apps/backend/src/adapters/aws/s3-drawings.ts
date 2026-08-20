import { randomUUID } from 'node:crypto'

import { ListObjectsV2Command, type S3Client } from '@aws-sdk/client-s3'
import { createPresignedPost } from '@aws-sdk/s3-presigned-post'
import type { Drawing } from '@fer-oshiro/realtime-contract'

import type { DrawingStorage } from '../../features/drawing'

interface S3DrawingStorageOptions {
  bucket: string
  maxUploadBytes?: number
  publicBaseUrl: string
  uploadExpiresInSeconds?: number
}

const DEFAULT_MAX_UPLOAD_BYTES = 1_000_000
const DEFAULT_UPLOAD_EXPIRES_IN_SECONDS = 300

const getNameFromKey = (key?: string) => {
  if (!key) return ''

  const fileName = key.split('/').pop() ?? ''
  return fileName.replace(/^\d+-/, '').replace('.svg', '')
}

export class S3DrawingStorage implements DrawingStorage {
  constructor(
    private readonly client: S3Client,
    private readonly options: S3DrawingStorageOptions,
  ) {}

  async list(): Promise<Drawing[]> {
    const command = new ListObjectsV2Command({
      Bucket: this.options.bucket,
      Prefix: 'gallery/',
      MaxKeys: 20,
    })
    const { Contents } = await this.client.send(command)

    return (Contents || [])
      .sort((a, b) => (!!a.Key && !!b.Key ? b.Key.localeCompare(a.Key) : 0))
      .map((item) => ({
        url: `${this.options.publicBaseUrl}/${item.Key}`,
        id: getNameFromKey(item.Key),
      }))
      .filter((item) => item.id)
  }

  async createUpload(name: string) {
    const maxBytes = this.options.maxUploadBytes ?? DEFAULT_MAX_UPLOAD_BYTES
    const expiresIn =
      this.options.uploadExpiresInSeconds ?? DEFAULT_UPLOAD_EXPIRES_IN_SECONDS
    const key = `submissions/${randomUUID()}.svg`
    const fields = {
      'Content-Type': 'image/svg+xml',
      'x-amz-meta-drawing-name': name,
    }
    const grant = await createPresignedPost(this.client, {
      Bucket: this.options.bucket,
      Key: key,
      Expires: expiresIn,
      Fields: fields,
      Conditions: [
        ['content-length-range', 1, maxBytes],
        { 'Content-Type': 'image/svg+xml' },
        { 'x-amz-meta-drawing-name': name },
      ],
    })

    return {
      ...grant,
      method: 'POST' as const,
      expiresAt: new Date(Date.now() + expiresIn * 1_000).toISOString(),
      maxBytes,
    }
  }
}
