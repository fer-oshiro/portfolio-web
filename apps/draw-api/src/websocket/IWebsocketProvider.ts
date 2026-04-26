export interface IWebSocketProvider {
  sendMessage(connectionId: string, payload: any): Promise<void>
}
