export const WS_URL =
  process.env.NODE_ENV === 'production'
    ? 'wss://6ga2gesq46.execute-api.us-east-1.amazonaws.com/prod'
    : 'ws://localhost:8080'

const devIceServers = [{ urls: 'stun:stun.l.google.com:19302' }]
const prodIceServers = [
  {
    urls: 'stun:global.stun.twilio.com:3478',
  },
  {
    urls: 'turn:global.turn.twilio.com:3478?transport=udp',
    username:
      'f69adc2c108350f4d1f3c1795c09933596fc154ac5d1830be7df739dd4881862',
    credential: 'CkZWEsbTVdmGZSwp7bW154E1zmq23IBe1kGSPhaU4bw=',
  },
  {
    urls: 'turn:global.turn.twilio.com:3478?transport=tcp',
    username:
      'f69adc2c108350f4d1f3c1795c09933596fc154ac5d1830be7df739dd4881862',
    credential: 'CkZWEsbTVdmGZSwp7bW154E1zmq23IBe1kGSPhaU4bw=',
  },
  {
    urls: 'turn:global.turn.twilio.com:443?transport=tcp',
    username:
      'f69adc2c108350f4d1f3c1795c09933596fc154ac5d1830be7df739dd4881862',
    credential: 'CkZWEsbTVdmGZSwp7bW154E1zmq23IBe1kGSPhaU4bw=',
  },
]

export const iceServers =
  process.env.NODE_ENV === 'production' ? prodIceServers : devIceServers
