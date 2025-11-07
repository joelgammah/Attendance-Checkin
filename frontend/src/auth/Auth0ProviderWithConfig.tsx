import React from 'react'
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react'
import { setTokenProvider } from '../api/client'
import { initializeAuth0UserProfile } from '../api/auth'

const Auth0Inner: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getAccessTokenSilently, loginWithRedirect, isAuthenticated, isLoading, error, user } = useAuth0()

  // Debug Auth0 state changes and initialize user profile
  React.useEffect(() => {
    console.log('🔍 Auth0 State Change:', {
      isAuthenticated,
      isLoading,
      hasUser: !!user,
      error: error?.message,
      userEmail: user?.email,
      currentUrl: window.location.href
    })
    
    // Initialize user profile for Auth0 users
    if (isAuthenticated && !isLoading && user) {
      const hasRoleData = localStorage.getItem('primary_role')
      const storedEmail = localStorage.getItem('user_email')
      
      // Check if stored email matches Auth0 user email
      const isCorrectUser = storedEmail === user.email
      
      if (!hasRoleData || !isCorrectUser) {
        if (!isCorrectUser) {
          console.log('DEBUG: Stored email mismatch, clearing localStorage and fetching fresh profile...')
          // Clear any old user data to prevent showing wrong user's info
          localStorage.removeItem('user_email')
          localStorage.removeItem('primary_role')
          localStorage.removeItem('active_role')
          localStorage.removeItem('roles')
          localStorage.removeItem('token') // Clear any legacy tokens
        } else {
          console.log('DEBUG: Auth0 user authenticated but no role data, fetching from backend...')
        }
        
        // Add a small delay to ensure token provider is ready
        setTimeout(() => {
          initializeAuth0UserProfile().catch((err) => {
            console.error('DEBUG: initializeAuth0UserProfile failed:', err)
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
          console.log('DEBUG: User is Auth0 authenticated, getting Auth0 token')
          // Test without audience to see if basic Auth0 token works with backend
          const token = await getAccessTokenSilently()
          console.log('DEBUG: Token provider got Auth0 token:', token ? 'SUCCESS' : 'NONE')
          if (token) {
            console.log('DEBUG: Token preview:', token.substring(0, 50) + '...')
          }
          return token
        } else {
          console.log('DEBUG: User not Auth0 authenticated, falling back to localStorage')
          return null // Will fall back to localStorage in client.ts
        }
      } catch (e: any) {
        console.log('DEBUG: Token provider error:', e)
        // Handle consent_required error by triggering interactive login
        if (e.error === 'consent_required' || /consent_required/i.test(e?.message || '')) {
          console.log('Consent required, redirecting to interactive login...')
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
    >
      <Auth0Inner>{children}</Auth0Inner>
    </Auth0Provider>
  )
}

export default Auth0ProviderWithConfig
