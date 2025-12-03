import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

// removed top-level imports so mocks/dynamic imports take effect
// Mock modules BEFORE importing the component under test
vi.mock('@auth0/auth0-react', () => ({
  Auth0Provider: ({ children }: any) => <>{children}</>,
  useAuth0: vi.fn(),
}))

// Only mock the relative paths so Vite doesn't try to resolve the project alias at transform time
vi.mock('../api/client', async () => {
  const actual = await vi.importActual('../api/client').catch(() => ({}))
  return { ...actual, setTokenProvider: vi.fn() }
})
vi.mock('../api/auth', async () => {
  const actual = await vi.importActual('../api/auth').catch(() => ({}))
  return { ...actual, initializeAuth0UserProfile: vi.fn().mockResolvedValue(undefined) }
})

// Use dynamic imports so the above mocks are applied
let Auth0ProviderWithConfig: React.FC<{ children?: React.ReactNode }>
let auth0: any
let setTokenProvider: any
let initializeAuth0UserProfile: any

beforeEach(async () => {
  vi.clearAllMocks()
  localStorage.clear()

  // import the mocked auth0 module
  auth0 = await import('@auth0/auth0-react')

  // prefer relative imports for the test runtime
  const clientMod = await import('../api/client')
  setTokenProvider = clientMod.setTokenProvider ?? vi.fn()

  const authMod = await import('../api/auth')
  initializeAuth0UserProfile = authMod.initializeAuth0UserProfile ?? vi.fn().mockResolvedValue(undefined)

  // import the component by relative path (resolves in test env)
  const mod = await import('../auth/Auth0ProviderWithConfig')
  Auth0ProviderWithConfig = mod.default
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Auth0ProviderWithConfig', () => {
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

  it('does not initialize profile when authenticated and stored email matches and role present', async () => {
    ;(auth0.useAuth0 as unknown as vi.Mock).mockReturnValue({
      getAccessTokenSilently: vi.fn().mockResolvedValue('token'),
      loginWithRedirect: vi.fn(),
      isAuthenticated: true,
      isLoading: false,
      error: null,
      user: { email: 'user@auth0.com' },
    })

    // stored email matches and role data present -> should NOT trigger initializeAuth0UserProfile
    localStorage.setItem('user_email', 'user@auth0.com')
    localStorage.setItem('primary_role', 'admin')

    render(
      <Auth0ProviderWithConfig>
        <div>no-init</div>
      </Auth0ProviderWithConfig>
    )

    // wait to ensure the delayed path would have been executed if called
    await new Promise((r) => setTimeout(r, 200))
    expect(initializeAuth0UserProfile).not.toHaveBeenCalled()
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

  it('token provider returns token when authenticated', async () => {
    const getAccessTokenSilently = vi.fn().mockResolvedValue('token-abc')
    ;(auth0.useAuth0 as unknown as vi.Mock).mockReturnValue({
      getAccessTokenSilently,
      loginWithRedirect: vi.fn(),
      isAuthenticated: true,
      isLoading: false,
      error: null,
      user: { email: 'user@auth0.com' },
    })

    render(
      <Auth0ProviderWithConfig>
        <div>token-test</div>
      </Auth0ProviderWithConfig>
    )

    const providerFn = (setTokenProvider as unknown as vi.Mock).mock.calls[0][0]
    const token = await providerFn()
    expect(token).toBe('token-abc')
    expect(getAccessTokenSilently).toHaveBeenCalled()
  })

  it('token provider returns null when unauthenticated', async () => {
    const getAccessTokenSilently = vi.fn()
    ;(auth0.useAuth0 as unknown as vi.Mock).mockReturnValue({
      getAccessTokenSilently,
      loginWithRedirect: vi.fn(),
      isAuthenticated: false,
      isLoading: false,
      error: null,
      user: null,
    })

    render(
      <Auth0ProviderWithConfig>
        <div>unauth-token-test</div>
      </Auth0ProviderWithConfig>
    )

    const providerFn = (setTokenProvider as unknown as vi.Mock).mock.calls[0][0]
    const token = await providerFn()
    expect(token).toBeNull()
    expect(getAccessTokenSilently).not.toHaveBeenCalled()
  })

  it('token provider triggers loginWithRedirect on consent_required error and returns null', async () => {
    const err = { error: 'consent_required', message: 'consent required' }
    const getAccessTokenSilently = vi.fn().mockRejectedValue(err)
    const loginWithRedirect = vi.fn().mockResolvedValue(undefined)

    ;(auth0.useAuth0 as unknown as vi.Mock).mockReturnValue({
      getAccessTokenSilently,
      loginWithRedirect,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      user: { email: 'user@auth0.com' },
    })

    render(
      <Auth0ProviderWithConfig>
        <div>consent-test</div>
      </Auth0ProviderWithConfig>
    )

    const providerFn = (setTokenProvider as unknown as vi.Mock).mock.calls[0][0]
    const token = await providerFn()
    expect(token).toBeNull()
    expect(loginWithRedirect).toHaveBeenCalled()
  })

  it('token provider returns null on non-consent error and does not redirect', async () => {
    const err = { error: 'invalid_request', message: 'some other error' }
    const getAccessTokenSilently = vi.fn().mockRejectedValue(err)
    const loginWithRedirect = vi.fn()

    ;(auth0.useAuth0 as unknown as vi.Mock).mockReturnValue({
      getAccessTokenSilently,
      loginWithRedirect,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      user: { email: 'user@auth0.com' },
    })

    render(
      <Auth0ProviderWithConfig>
        <div>non-consent-test</div>
      </Auth0ProviderWithConfig>
    )

    const providerFn = (setTokenProvider as unknown as vi.Mock).mock.calls[0][0]
    const token = await providerFn()
    expect(token).toBeNull()
    expect(loginWithRedirect).not.toHaveBeenCalled()
  })
})