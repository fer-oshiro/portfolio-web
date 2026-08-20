interface TurnstileResponse {
  action?: string
  hostname?: string
  success?: boolean
}

export interface TurnstileVerifierOptions {
  action: string
  hostname: string
  secretKey: string
  timeoutMs?: number
}

type Fetch = typeof fetch

export class TurnstileVerifier {
  constructor(
    private readonly options: TurnstileVerifierOptions,
    private readonly fetchRequest: Fetch = fetch,
  ) {}

  async verify(token: string, remoteIp?: string): Promise<boolean> {
    if (!token || token.length > 2_048) return false

    const body = new URLSearchParams({
      secret: this.options.secretKey,
      response: token,
    })
    if (remoteIp) body.set('remoteip', remoteIp)

    try {
      const response = await this.fetchRequest(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
          method: 'POST',
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
          body,
          signal: AbortSignal.timeout(this.options.timeoutMs ?? 3_000),
        },
      )
      if (!response.ok) return false

      const result = (await response.json()) as TurnstileResponse
      return (
        result.success === true &&
        result.hostname === this.options.hostname &&
        result.action === this.options.action
      )
    } catch {
      return false
    }
  }
}
