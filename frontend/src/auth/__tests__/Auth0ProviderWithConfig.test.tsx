import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import Auth0ProviderWithConfig from '../Auth0ProviderWithConfig'
import * as auth0 from '@auth0/auth0-react'
import { setTokenProvider } from '../../api/client'
import { initializeAuth0UserProfile } from '../../api/auth'

// Mocks
vi.mock('@auth0/auth0-react', () => ({
  Auth0Provider: ({ children }: any) => <>{children}</>,
  useAuth0: vi.fn(),
}))
vi.mock('../../api/client', () => ({ setTokenProvider: vi.fn() }))
vi.mock('../../api/auth', () => ({ initializeAuth0UserProfile: vi.fn().mockResolvedValue(undefined) }))

describe('Auth0ProviderWithConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders children and registers token provider when unauthenticated', () => {
    ;(auth0.useAuth0 as unknown as vi.Mock).mockReturnValue({
      getAccessTokenSilently: vi.fn(),
      loginWithRedirect: vi.fn(),
      isAuthenticated: false,
      isLoading: false,
      error: null,
      user: null,
    })

    render(
      <Auth0ProviderWithConfig>
        <div>hello</div>
      </Auth0ProviderWithConfig>
    )

    expect(screen.getByText('hello')).toBeInTheDocument()
    expect(setTokenProvider).toHaveBeenCalledTimes(1)
    const providerFn = (setTokenProvider as unknown as vi.Mock).mock.calls[0][0]
    expect(typeof providerFn).toBe('function')
  })

  it('initializes profile when authenticated and stored email mismatches', async () => {
    ;(auth0.useAuth0 as unknown as vi.Mock).mockReturnValue({
      getAccessTokenSilently: vi.fn().mockResolvedValue('token'),
      loginWithRedirect: vi.fn(),
      isAuthenticated: true,
      isLoading: false,
      error: null,
      user: { email: 'user@auth0.com' },
    })

    // stored email doesn't match -> should trigger initializeAuth0UserProfile via setTimeout
    localStorage.setItem('user_email', 'other@local.com')

    render(
      <Auth0ProviderWithConfig>
        <div>hi</div>
      </Auth0ProviderWithConfig>
    )

    // wait for the 100ms timeout in the component + the async mock to resolve
    await waitFor(() => {
      expect(initializeAuth0UserProfile).toHaveBeenCalled()
    }, { timeout: 1000 })
  })
})