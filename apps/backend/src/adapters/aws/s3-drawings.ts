import {
  ListObjectsV2Command,
  PutObjectCommand,
  type S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { Drawing } from '@fer-oshiro/realtime-contract'

import type { DrawingStorage } from '../../features/drawing'

interface S3DrawingStorageOptions {
  bucket: string
  publicBaseUrl: string
}

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

  async createUpload(name: string): Promise<{ url: string }> {
    const command = new PutObjectCommand({
      Bucket: this.options.bucket,
      Key: `submissions/${Date.now()}-${name}`,
      ContentType: 'image/svg+xml',
    })
    const url = await getSignedUrl(this.client, command, { expiresIn: 3600 })

    return { url }
  }
}
