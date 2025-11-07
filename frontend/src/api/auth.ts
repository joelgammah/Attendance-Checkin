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
  localStorage.setItem('user_email', email)
  localStorage.setItem('roles', JSON.stringify(data.roles))
  localStorage.setItem('primary_role', data.primary_role)
  
  // Always set active_role to primary_role on login
  localStorage.setItem('active_role', data.primary_role)
  
  return data
}

export interface UserProfile {
  id: number
  email: string
  name: string
  roles: string[]
  primary_role: string
}

export async function getUserProfile(): Promise<UserProfile> {
  return fetchJson<UserProfile>('/v1/users/me')
}

export async function initializeAuth0UserProfile(): Promise<void> {
  try {
    console.log('DEBUG: Fetching user profile from backend...')
    const profile = await getUserProfile()
    console.log('DEBUG: Got user profile:', profile)
    
    // Store profile data in localStorage to match legacy flow
    localStorage.setItem('user_email', profile.email)
    localStorage.setItem('roles', JSON.stringify(profile.roles))
    localStorage.setItem('primary_role', profile.primary_role)
    localStorage.setItem('active_role', profile.primary_role)
    
    console.log('DEBUG: Stored Auth0 user profile in localStorage')
    
    // Trigger a storage event to notify components of the update
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'primary_role',
      newValue: profile.primary_role
    }))
  } catch (error: any) {
    console.error('DEBUG: Failed to fetch user profile:', error?.message || error)
    // Provide sensible defaults for Auth0 users if backend fails
    console.log('DEBUG: Using fallback defaults for Auth0 user')
    localStorage.setItem('primary_role', 'attendee')
    localStorage.setItem('active_role', 'attendee')
    localStorage.setItem('roles', JSON.stringify(['attendee']))
    localStorage.setItem('user_email', 'Auth0 User')
  }
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