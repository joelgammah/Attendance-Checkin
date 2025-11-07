const BASE = import.meta.env.VITE_API_URL || '/api'

// Optional token provider (registered by Auth0ProviderWithConfig) so the
// client can obtain access tokens via the Auth0 React SDK. Falls back to
// reading a token from localStorage for backwards compatibility.
let tokenProvider: (() => Promise<string | null>) | null = null
export function setTokenProvider(fn: (() => Promise<string | null>) | null) {
  tokenProvider = fn
}

export async function fetchJson<T>(path: string, opts: RequestInit = {}): Promise<T> {
  // attempt to obtain token from provider first
  let token: string | null = null
  let tokenSource = 'none'
  
  if (tokenProvider) {
    try {
      token = await tokenProvider()
      if (token) tokenSource = 'auth0-provider'
    } catch (_) {
      token = null
    }
  }

  // fallback to localStorage for compatibility
  if (!token) {
    token = localStorage.getItem('token')
    if (token) tokenSource = 'localStorage'
  }

  console.log(`DEBUG: API call to ${path}, token source: ${tokenSource}`)

  const headers: HeadersInit = { 'Content-Type': 'application/json', ...(opts.headers || {}) }
  if (token) (headers as any)['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { ...opts, headers })
  if (!res.ok) {
    const msg = await res.text()
    throw new Error(msg || res.statusText)
  }
  return res.headers.get('content-type')?.includes('application/json') ? res.json() : (await res.text() as any)
}
