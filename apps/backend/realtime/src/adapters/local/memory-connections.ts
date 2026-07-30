import type { Connection, ConnectionRepository } from '../../features/signaling'

export class MemoryConnectionRepository implements ConnectionRepository {
  private readonly connections = new Map<string, Connection>()

  async findById(connectionId: string): Promise<Connection | null> {
    return this.connections.get(connectionId) ?? null
  }

  async findByRoom(roomId: string): Promise<Connection[]> {
    return [...this.connections.values()].filter(
      (connection) => connection.roomId === roomId,
    )
  }

  async remove(connectionId: string): Promise<void> {
    this.connections.delete(connectionId)
  }

  async save(connection: Connection): Promise<void> {
    this.connections.set(connection.connectionId, connection)
  }
}
