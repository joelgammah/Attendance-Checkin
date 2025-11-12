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
        setTimeout(() => {
          initializeAuth0UserProfile().catch(() => {
            // Initialization failed, user may need to log in again
          })
        }, 100)
      }
    }
  }, [isAuthenticated, isLoading, error, user])

  React.useEffect(() => {
    // Register a token provider that client.ts can call to get the current access token
    setTokenProvider(async () => {
      try {
        // Always prioritize Auth0 if user is authenticated via Auth0
        if (isAuthenticated) {
          // Test without audience to see if basic Auth0 token works with backend
          const token = await getAccessTokenSilently()
          return token
        } else {
          return null // Will fall back to localStorage in client.ts
        }
      } catch (e: any) {
        // Handle consent_required error by triggering interactive login
        if (e.error === 'consent_required' || /consent_required/i.test(e?.message || '')) {
          await loginWithRedirect({ 
            authorizationParams: { 
              audience: import.meta.env.VITE_AUTH0_AUDIENCE as string | undefined 
            } 
          })
          return null // Will redirect, so no token to return now
        }
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
    >
      <Auth0Inner>{children}</Auth0Inner>
    </Auth0Provider>
  )
}

export default Auth0ProviderWithConfig
