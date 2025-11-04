import { fetchJson } from './client'

export type Role = 'attendee' | 'organizer' | 'admin'

export interface LoginResponse {
  access_token: string
  token_type: string
  roles: Role[]
  primary_role: Role
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const data = await fetchJson<LoginResponse>(`/v1/auth/login`, { method: 'POST', body: JSON.stringify({ email, password }) })
  
  // Store auth data
  localStorage.setItem('token', data.access_token)
  
  localStorage.setItem('roles', JSON.stringify(data.roles))
  localStorage.setItem('primary_role', data.primary_role)
  
  // Always set active_role to primary_role on login
  localStorage.setItem('active_role', data.primary_role)
  
  return data
}

export function logout(){ 
  localStorage.removeItem('token')
  localStorage.removeItem('roles')
  localStorage.removeItem('primary_role')
  localStorage.removeItem('active_role')
}

export function getUserRole(): string | null {
  // Prefer active role, then primary role
  return localStorage.getItem('active_role') || 
         localStorage.getItem('primary_role')
}

export function getUserRoles(): Role[] {
  try {
    const raw = localStorage.getItem('roles')
    if (raw) {
      return JSON.parse(raw) as Role[]
    }
  } catch {}
  
  return []
}

export function getActiveRole(): Role | null {
  return localStorage.getItem('active_role') as Role | null ||
         localStorage.getItem('primary_role') as Role | null
}

export function setActiveRole(role: Role) {
  localStorage.setItem('active_role', role)
}