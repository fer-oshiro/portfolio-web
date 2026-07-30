const productionUrl =
  'wss://6ga2gesq46.execute-api.us-east-1.amazonaws.com/prod'
const hostname = window.location.hostname
const isLocalHostname =
  hostname === 'localhost' ||
  hostname === '0.0.0.0' ||
  hostname === '::1' ||
  hostname === '[::1]' ||
  hostname.endsWith('.local') ||
  /^127\./.test(hostname) ||
  /^10\./.test(hostname) ||
  /^192\.168\./.test(hostname) ||
  /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
const localSocketHost =
  hostname.includes(':') && !hostname.startsWith('[')
    ? `[${hostname}]`
    : hostname

export const WS_URL = isLocalHostname
  ? `ws://${localSocketHost}:8080`
  : productionUrl
