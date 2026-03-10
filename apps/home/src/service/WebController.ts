import { WebRTCBase } from './WebRTCEngine'

// WebController.ts
export class WebController extends WebRTCBase {
  constructor(
    onData: (data: any) => void,
    onConnectionState: (state: RTCPeerConnectionState) => void,
    onLog: (log: string) => void,
  ) {
    super(onLog, onConnectionState)

    const channel = this.pc.createDataChannel('gyro-data', {
      ordered: false,
      maxRetransmits: 0,
    })

    this.setupDataChannel(channel, onData)
  }
}
