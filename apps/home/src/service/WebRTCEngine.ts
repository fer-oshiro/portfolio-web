import { iceServers } from './constants'

export class WebRTCEngine {
  pc: RTCPeerConnection
  dc?: RTCDataChannel
  private iceBuffer: RTCIceCandidateInit[] = []
  private isRemoteSet = false

  constructor(
    onData: (data: any) => void,
    onConnected: (state: boolean) => void,
  ) {
    this.pc = new RTCPeerConnection({ iceServers })

    this.pc.ondatachannel = (e) => {
      this.dc = e.channel
      this.dc.onmessage = (msg) => onData(JSON.parse(msg.data))
      this.dc.onopen = () => onConnected(true)
      this.dc.onclose = () => onConnected(false)
    }
  }

  async createOffer() {
    const offer = await this.pc.createOffer()
    await this.pc.setLocalDescription(offer)
    return offer
  }

  async createAnswer(remoteSdp: RTCSessionDescriptionInit) {
    await this.pc.setRemoteDescription(new RTCSessionDescription(remoteSdp))
    this.isRemoteSet = true
    this.drainIce()
    const answer = await this.pc.createAnswer()
    await this.pc.setLocalDescription(answer)
    return answer
  }

  async handleAnswer(remoteSdp: RTCSessionDescriptionInit) {
    await this.pc.setRemoteDescription(new RTCSessionDescription(remoteSdp))
    this.isRemoteSet = true
    this.drainIce()
  }

  async addIce(candidate: RTCIceCandidateInit) {
    if (this.isRemoteSet) await this.pc.addIceCandidate(candidate)
    else this.iceBuffer.push(candidate)
  }

  private async drainIce() {
    for (const cand of this.iceBuffer) await this.pc.addIceCandidate(cand)
    this.iceBuffer = []
  }
}
