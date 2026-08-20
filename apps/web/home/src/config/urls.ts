declare const __WEBSOCKET_URL__: string
declare const __TURNSTILE_SITE_KEY__: string

export const WS_URL = __WEBSOCKET_URL__

export const webUrls = Object.freeze({
  websocket: WS_URL,
  turnstileSiteKey: __TURNSTILE_SITE_KEY__,
})
