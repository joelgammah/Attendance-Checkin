import { fetchJson } from './client'

export async function login(email: string, password: string) {
  const data = await fetchJson<{access_token: string}>(`/v1/auth/login`, { method: 'POST', body: JSON.stringify({ email, password }) })
  localStorage.setItem('token', data.access_token)
}

export function logout(){ localStorage.removeItem('token') }
