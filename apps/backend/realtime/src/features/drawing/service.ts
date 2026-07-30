import type { DrawingDependencies } from './ports'

export class DrawingService {
  constructor(private readonly dependencies: DrawingDependencies) {}

  async list(connectionId: string): Promise<void> {
    const drawings = await this.dependencies.storage.list()

    await this.dependencies.publisher.send(connectionId, {
      type: 'drawings',
      drawings,
    })
  }

  async createUpload(connectionId: string, name: string): Promise<void> {
    const { url } = await this.dependencies.storage.createUpload(name)

    await this.dependencies.publisher.send(connectionId, {
      type: 'upload_url',
      url,
    })
  }
}
