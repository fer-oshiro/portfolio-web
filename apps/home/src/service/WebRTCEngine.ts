export abstract class WebRTCBase {
  pc: RTCPeerConnection
  dc?: RTCDataChannel

  private pendingCandidates: RTCIceCandidateInit[] = []
  private remoteDescriptionSet = false

  constructor(
    private onLog: (log: string) => void,
    private onConnectionState: (state: RTCPeerConnectionState) => void,
    private iceServers: RTCIceServer[],
  ) {
    this.pc = new RTCPeerConnection({ iceServers: this.iceServers })

    this.pc.oniceconnectionstatechange = () =>
      this.onLog(`ICE: ${this.pc.iceConnectionState}`)
    this.pc.onconnectionstatechange = () =>
      this.onConnectionState(this.pc.connectionState)
  }

  protected setupDataChannel(
    channel: RTCDataChannel,
    onData: (data: any) => void,
  ) {
    this.dc = channel
    this.dc.onmessage = (e) => {
      try {
        onData(JSON.parse(e.data))
      } catch (err) {
        this.onLog('Erro ao processar JSON')
      }
    }
    this.dc.onopen = () => this.onLog('DataChannel Aberto')
    this.dc.onclose = () => this.onLog('DataChannel Fechado')
  }

  // Métodos de sinalização padrão
  async createOffer() {
    const offer = await this.pc.createOffer()
    await this.pc.setLocalDescription(offer)
    this.onLog('📤 Offer enviado')
    return offer
  }

  async createAnswer(remoteSdp: RTCSessionDescriptionInit) {
    await this.setRemoteDescription(remoteSdp)
    const answer = await this.pc.createAnswer()
    await this.pc.setLocalDescription(answer)
    return answer
  }

  async handleRemoteDescription(remoteSdp: RTCSessionDescriptionInit) {
    await this.setRemoteDescription(remoteSdp)
    this.onLog('✅ P2P Handshake finalizado')
  }

  async addIceCandidate(candidate: RTCIceCandidateInit) {
    if (!candidate || !candidate.candidate) return
    if (!this.remoteDescriptionSet) {
      this.pendingCandidates.push(candidate)
      return
    }
    try {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidate))
    } catch (e) {
      this.onLog('Erro ao adicionar ICE: ' + e)
    }
  }

  protected async setRemoteDescription(sdp: RTCSessionDescriptionInit) {
    await this.pc.setRemoteDescription(new RTCSessionDescription(sdp))
    this.remoteDescriptionSet = true

    for (const candidate of this.pendingCandidates) {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidate))
    }
    this.pendingCandidates = []
  }

  send(data: any) {
    if (this.dc?.readyState === 'open') {
      this.dc.send(JSON.stringify(data))
    }
  }
}
