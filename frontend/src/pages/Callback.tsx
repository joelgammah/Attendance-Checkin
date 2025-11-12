import React from 'react'
import { useAuth0 } from '@auth0/auth0-react'

export default function CallbackPage(){
  const { isAuthenticated, isLoading, error, user } = useAuth0()

  React.useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // Use history.pushState instead of window.location.href to preserve Auth0 state
        window.history.pushState({}, '', '/')
        // Trigger a popstate event to update the router
        window.dispatchEvent(new PopStateEvent('popstate'))
      }
    }
  }, [isLoading, isAuthenticated, error, user])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin mb-4">🔄</div>
        <h2 className="text-xl font-medium">Processing sign in…</h2>
        <p className="text-sm text-gray-600">Please wait while we finish signing you in.</p>
        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
            <strong>Error:</strong> {error.message}
          </div>
        )}
      </div>
    </div>
  )
}
