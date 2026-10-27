import type {
  TurnCredential,
  TurnCredentialStore,
} from '../../features/signaling'

export class MemoryTurnCredentialStore implements TurnCredentialStore {
  private credential: TurnCredential | null = null

  async find(): Promise<TurnCredential | null> {
    return this.credential
  }

  async save(credential: TurnCredential): Promise<void> {
    this.credential = credential
  }
}
