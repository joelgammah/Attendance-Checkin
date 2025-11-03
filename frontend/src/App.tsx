import React, { useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import Protected from './components/Protected'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import AttendeeDashboard from './pages/AttendeeDashboard'
import EventFormPage from './pages/EventFormPage'
import EventDetailPage from './pages/EventDetailPage'
import EventAttendeesPage from './pages/EventAttendeesPage'
import CheckInPage from './pages/CheckInPage'
import CheckInStart from './pages/CheckInStart'
import { getActiveRole } from './api/auth'
import AdminDashboardPage from './pages/AdminDashboardPage'

// Minimal router helpers
function usePath(){ return location.pathname }
export function useParams(){
  const path = usePath()
  const m = path.match(/\/events\/(.+)$/)
  const attendeesMatch = path.match(/^\/events\/(\d+)\/attendees$/)
  
  if (attendeesMatch) {
    return { eventId: attendeesMatch[1] }
  }
  
  return { token: m? m[1]: '' }
}
export function useSearch(){
  const p = new URLSearchParams(location.search)
  return { token: p.get('token') || '' }
}

export { useParams as useParams_compat, useSearch as useSearch_compat }

function ProtectedDashboard() {
  const role = getActiveRole()
  
  // Route based on user role (uses active role which can be switched)
  if (role === 'attendee') {
    return <AttendeeDashboard />
  } else if (role === 'organizer') {
    return <DashboardPage />
  }
  else {
    // admin
    return <AdminDashboardPage />
  }
}

// Auth0 Login Component
function Auth0Login() {
  const { loginWithRedirect } = useAuth0()
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Terrier Check-In</h2>
          <p className="mt-2 text-gray-600">Sign in to continue</p>
        </div>
        <button
          onClick={() => loginWithRedirect()}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Sign In with Auth0
        </button>
      </div>
    </div>
  )
}

// Auth0 Loading Component
function Auth0Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-xl">Loading...</div>
    </div>
  )
}

// Main App Routes (after authentication)
function AppRoutes() {
  const path = usePath()
  if(path.startsWith('/login')) return <LoginPage />
  if(path.startsWith('/events/new')) return <Protected roles={['organizer', 'admin']}><EventFormPage /></Protected>
  if(path.match(/^\/events\/\d+\/attendees$/)) return <Protected roles={['organizer', 'admin']}><EventAttendeesPage /></Protected>
  if(path.startsWith('/events/')) return <Protected roles={['organizer', 'admin']}><EventDetailPage /></Protected>
  if(path === '/checkin/start') return <CheckInStart />
  if(path.startsWith('/checkin')) return <CheckInPage />
  return <Protected><ProtectedDashboard /></Protected>
}

export default function App(){
  const { isAuthenticated, isLoading, user, getAccessTokenSilently } = useAuth0()
  const path = usePath()
  
  // Allow public access to check-in pages (no Auth0 required)
  if(path === '/checkin/start' || path.startsWith('/checkin')) {
    return <AppRoutes />
  }
  
  // Show loading while Auth0 is initializing
  if (isLoading) {
    return <Auth0Loading />
  }
  
  // Show Auth0 login if not authenticated
  if (!isAuthenticated) {
    return <Auth0Login />
  }
  
  // Store real Auth0 token for API calls
  useEffect(() => {
    if (user && isAuthenticated) {
      console.log('=== AUTH0 DEBUG ===')
      console.log('Auth0 user:', user)
      
      getAccessTokenSilently({
        authorizationParams: {
          audience: `https://${import.meta.env.VITE_AUTH0_DOMAIN}/api/v2/`,
          scope: 'openid profile email'
        }
      })
        .then(token => {
          console.log('✅ Auth0 token obtained successfully')
          console.log('Token preview:', token.substring(0, 50) + '...')
          
          // Store the real Auth0 JWT token
          localStorage.setItem('token', token)
          localStorage.setItem('user', JSON.stringify({
            email: user.email,
            name: user.name,
            picture: user.picture
          }))
        })
        .catch(error => {
          console.error('❌ Error getting Auth0 token:', error)
          console.log('Using user email for authentication')
          
          // Simple fallback: just store user info
          localStorage.setItem('token', `user_${user.email}`)
          localStorage.setItem('user', JSON.stringify({
            email: user.email,
            name: user.name,
            picture: user.picture
          }))
        })
    }
  }, [user, isAuthenticated, getAccessTokenSilently])
  
  // Render authenticated app
  return <AppRoutes />
}