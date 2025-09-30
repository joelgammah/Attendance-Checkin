import { fetchJson } from './client'

interface LoginResponse {
  access_token: string
  token_type: string
  role: string
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const data = await fetchJson<LoginResponse>(`/v1/auth/login`, { method: 'POST', body: JSON.stringify({ email, password }) })
  localStorage.setItem('token', data.access_token)
  localStorage.setItem('role', data.role)
  return data
}

export function logout(){ 
  localStorage.removeItem('token')
  localStorage.removeItem('role')
}

export function getUserRole(): string | null {
  return localStorage.getItem('role')
}
