import React, { useEffect, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'

interface Props {
  children: React.ReactNode
}

export default function Auth0Bridge({ children }: Props) {
  const { isAuthenticated, isLoading, user, loginWithRedirect, logout } = useAuth0()
  const [isTokenSynced, setIsTokenSynced] = useState(false)

  useEffect(() => {
    if (isAuthenticated && user && !isTokenSynced) {
      // Here you would sync the Auth0 user with your backend
      // For now, we'll simulate storing the token in localStorage
      // to work with your existing auth system
      const mockToken = `auth0_${user.sub}`
      localStorage.setItem('token', mockToken)
      localStorage.setItem('user', JSON.stringify({
        email: user.email,
        name: user.name,
        picture: user.picture
      }))
      setIsTokenSynced(true)
    } else if (!isAuthenticated && isTokenSynced) {
      // Clear tokens when logged out
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setIsTokenSynced(false)
    }
  }, [isAuthenticated, user, isTokenSynced])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">QR Check-In System</h2>
            <p className="mt-2 text-gray-600">Sign in to continue</p>
          </div>
          <button
            onClick={() => loginWithRedirect()}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}