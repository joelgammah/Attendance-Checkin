import React from 'react'
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react'
import { setTokenProvider } from '../api/client'
import { initializeAuth0UserProfile } from '../api/auth'

const Auth0Inner: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getAccessTokenSilently, loginWithRedirect, isAuthenticated, isLoading, error, user } = useAuth0()

  // Initialize user profile for Auth0 users
  React.useEffect(() => {
    // Initialize user profile for Auth0 users
    if (isAuthenticated && !isLoading && user) {
      console.debug('[Auth0Inner] isAuthenticated && !isLoading && user ->', { isAuthenticated, isLoading, userEmail: user?.email, storedEmail: localStorage.getItem('user_email') })
      const hasRoleData = localStorage.getItem('primary_role')
      const storedEmail = localStorage.getItem('user_email')

      // Check if stored email matches Auth0 user email
      const isCorrectUser = storedEmail === user.email

      if (!hasRoleData || !isCorrectUser) {
        if (!isCorrectUser) {
          // Clear any old user data to prevent showing wrong user's info
          localStorage.removeItem('user_email')
          localStorage.removeItem('primary_role')
          localStorage.removeItem('active_role')
          localStorage.removeItem('roles')
          localStorage.removeItem('token') // Clear any legacy tokens
        }
        
        // Add a small delay to ensure token provider is ready
        const timeoutId = setTimeout(() => {
          console.debug('[Auth0Inner] calling initializeAuth0UserProfile after delay; local token present?', !!localStorage.getItem('token'))
          if (initializeAuth0UserProfile && typeof initializeAuth0UserProfile === 'function') {
            try {
              const result = initializeAuth0UserProfile()
              if (result && typeof result.catch === 'function') {
                result.catch((err) => {
                  console.error('Failed to initialize Auth0 user profile:', err)
                })
              }
            } catch (err) {
              console.error('Failed to initialize Auth0 user profile:', err)
            }
          }
        }, 100)
        
        return () => {
          clearTimeout(timeoutId)
        }
      }
    }
  }, [isAuthenticated, isLoading, error, user])

  React.useEffect(() => {
    // Register a token provider that client.ts can call to get the current access token
    setTokenProvider(async () => {
      console.debug('[Auth0Inner] tokenProvider invoked; isAuthenticated=', isAuthenticated)
      try {
        // Always prioritize Auth0 if user is authenticated via Auth0
        if (isAuthenticated) {
          const token = await getAccessTokenSilently({
            authorizationParams: {
              audience: import.meta.env.VITE_AUTH0_AUDIENCE as string | undefined
            }
          })
          console.debug('[Auth0Inner] getAccessTokenSilently returned token (masked):', token ? `${token.slice(0,8)}...` : null)
          return token
        } else {
          console.debug('[Auth0Inner] tokenProvider: not authenticated via Auth0, returning null')
          return null // Will fall back to localStorage in client.ts
        }
      } catch (e: any) {
        console.debug('[Auth0Inner] tokenProvider threw', e)
        // Handle consent_required error by triggering interactive login
        if (e.error === 'consent_required' || /consent_required/i.test(e?.message || '')) {
          await loginWithRedirect({ 
            authorizationParams: { 
              audience: import.meta.env.VITE_AUTH0_AUDIENCE as string | undefined 
            } 
          })
          return null // Will redirect, so no token to return now
        }
        console.warn('Token fetch failed, falling back to localStorage')
        return null // Will fall back to localStorage in client.ts
      }
    })
    // no cleanup - allow provider to remain until page reload
  }, [getAccessTokenSilently, loginWithRedirect, isAuthenticated])

  return <>{children}</>
}

export const Auth0ProviderWithConfig: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const domain = import.meta.env.VITE_AUTH0_DOMAIN as string
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID as string
  const redirectUri = (import.meta.env.VITE_AUTH0_REDIRECT_URI as string) || window.location.origin
  const audience = import.meta.env.VITE_AUTH0_AUDIENCE as string | undefined

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: redirectUri,
        audience,
        scope: 'openid profile email',
      }}
      cacheLocation="localstorage"
      useRefreshTokens={false}
    >
      <Auth0Inner>{children}</Auth0Inner>
    </Auth0Provider>
  )
}

export default Auth0ProviderWithConfig