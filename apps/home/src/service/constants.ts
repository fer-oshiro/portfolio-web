export const WS_URL = window.location.host.includes('localhost')
  ? 'ws://localhost:8080'
  : 'wss://6ga2gesq46.execute-api.us-east-1.amazonaws.com/prod'
