import { WebRTCBase } from './WebRTCEngine'

export class MobileReceiver extends WebRTCBase {
  constructor(
    onData: (data: any) => void,
    onConnectionState: (state: RTCPeerConnectionState) => void,
    onLog: (log: string) => void,
    iceServers: RTCIceServer[],
  ) {
    super(onLog, onConnectionState, iceServers)

    this.pc.ondatachannel = (event) => {
      this.setupDataChannel(event.channel, onData)
    }
  }
}
