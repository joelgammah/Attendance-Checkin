const BASE = import.meta.env.VITE_API_URL ?? '/api'

export async function fetchJson<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token')
  const headers: HeadersInit = { 'Content-Type': 'application/json', ...(opts.headers || {}) }
  if (token) (headers as any)['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${BASE}${path}`, { ...opts, headers })
  if (!res.ok) {
    const msg = await res.text()
    throw new Error(msg || res.statusText)
  }
  return res.headers.get('content-type')?.includes('application/json') ? res.json() : (await res.text() as any)
}
