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
  
  if (tokenProvider) {
    try {
      console.debug('[client] tokenProvider present, calling tokenProvider()')
      token = await tokenProvider()
      console.debug('[client] tokenProvider returned', token ? `${token.slice(0,8)}...` : null)
    } catch (err) {
      console.debug('[client] tokenProvider threw error', err)
      token = null
    }
  }

  // fallback to localStorage for compatibility
  if (!token) {
    token = localStorage.getItem('token')
  }

  const headers: HeadersInit = { 'Content-Type': 'application/json', ...(opts.headers || {}) }
  if (token) (headers as any)['Authorization'] = `Bearer ${token}`

  console.debug('[client] fetch', `${BASE}${path}`, { method: opts.method || 'GET', headers })
  const res = await fetch(`${BASE}${path}`, { ...opts, headers })
  console.debug('[client] response', res.status, res.statusText)
  if (!res.ok) {
    const msg = await res.text()
    console.debug('[client] response body on error:', msg)
    throw new Error(msg || res.statusText)
  }
  const contentType = res.headers.get('content-type') || ''
  return contentType.includes('application/json') ? res.json() : (await res.text() as any)
}
