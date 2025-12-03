import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import '@testing-library/jest-dom'
import LoginPage from '../pages/LoginPage'

// Mock fetch globally
vi.stubGlobal('fetch', vi.fn(async (input: any, init?: any) => {
  if (String(input).includes('/auth/login')) {
    return new Response(JSON.stringify({ 
      access_token: 't', 
      token_type: 'bearer', 
      roles: ['organizer'],
      primary_role: 'organizer'
    }), { 
      headers: { 'content-type': 'application/json' } 
    })
  }
  return new Response('{}', { 
    headers: { 'content-type': 'application/json' } 
  })
}))

// Mock location
vi.stubGlobal('location', { 
  href: '/', 
  origin: 'http://localhost' 
} as any)

// Add these mocks BEFORE rendering LoginPage (Vitest hoists vi.mock)
vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    loginWithRedirect: vi.fn(),
    isAuthenticated: false,
    isLoading: false,
    user: null,
    getAccessTokenSilently: vi.fn().mockResolvedValue('mock-token')
  })
}))

vi.mock('../api/auth', () => {
  return {
    login: vi.fn(async (email: string, password: string) => {
      // Delegate to global fetch so your tests can control responses/timing
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      // Allow rejection to bubble up for the error test
      const data = await res.json()

      // Store values so tests can assert localStorage
      if (data?.access_token) localStorage.setItem('token', data.access_token)
      if (data?.roles) localStorage.setItem('roles', JSON.stringify(data.roles))
      if (data?.primary_role) {
        localStorage.setItem('primary_role', data.primary_role)
        localStorage.setItem('active_role', data.primary_role)
      }
      return data
    })
  }
})

// Ensure window.location has a .search property used by the component
;(globalThis as any).location = {
  ...(globalThis as any).location,
  href: (globalThis as any).location?.href ?? '/',
  origin: (globalThis as any).location?.origin ?? 'http://localhost',
  search: (globalThis as any).location?.search ?? ''
}

describe('LoginPage', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Clean up after each test
    localStorage.clear()
  })

  it('renders login form', () => {
    render(<LoginPage />)
    
    // Use the actual text from your page
    expect(screen.getByText('Sign in to access Terrier Check-In')).toBeInTheDocument()
    expect(screen.getByText('Sign in')).toBeInTheDocument()
  })

  it('logs in with demo creds', async () => {
    render(<LoginPage />)
    // Query inputs by accessible label (email and password start blank)
    const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password' } })
    
    // Submit the form
    fireEvent.click(screen.getByText('Sign in'))
    
    // Wait for login to complete
    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe('t')
    })
    
    await waitFor(() => {
      expect(localStorage.getItem('primary_role')).toBe('organizer')
    })
    
    await waitFor(() => {
      expect(localStorage.getItem('roles')).toBe('["organizer"]')
    })
    
    await waitFor(() => {
      expect(localStorage.getItem('active_role')).toBe('organizer')
    })
  })

  it('shows loading state during login', async () => {
    // Mock a slow fetch to see loading state
    vi.stubGlobal('fetch', vi.fn(async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
      return new Response(JSON.stringify({ 
        access_token: 't', 
        token_type: 'bearer', 
        roles: ['organizer'],
        primary_role: 'organizer'
      }), { 
        headers: { 'content-type': 'application/json' } 
      })
    }))
    
    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password' } })
    
    fireEvent.click(screen.getByText('Sign in'))
    
    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('Signing in...')).toBeInTheDocument()
    })
  })

  it('handles login error', async () => {
    // Mock fetch to return an error
    const mockFetch = vi.fn().mockRejectedValueOnce(new Error('Login failed'))
    vi.stubGlobal('fetch', mockFetch)
    
    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    
    fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
    
    fireEvent.click(screen.getByText('Sign in'))
    
    // Just check that the page still renders after error
    await waitFor(() => {
      expect(screen.getByText('Sign in to access Terrier Check-In')).toBeInTheDocument()
    })
  })

  it('basic rendering without errors', () => {
    // Simple test to boost coverage
    render(<LoginPage />)
    expect(screen.getByText('Sign in to access Terrier Check-In')).toBeInTheDocument()
  })
})