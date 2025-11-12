import React from 'react'
import Protected from './components/Protected'
import LoginPage from './pages/LoginPage'
import CallbackPage from './pages/Callback'
import DashboardPage from './pages/DashboardPage'
import AttendeeDashboard from './pages/AttendeeDashboard'
import EventFormPage from './pages/EventFormPage'
import EventDetailPage from './pages/EventDetailPage'
import EventAttendeesPage from './pages/EventAttendeesPage'
import CheckInPage from './pages/CheckInPage'
import CheckInStart from './pages/CheckInStart'
import { getActiveRole } from './api/auth'
import AdminDashboardPage from './pages/AdminDashboardPage'
import EmailVerificationSuccess from './pages/EmailVerificationSuccess'

// Minimal router helpers
function usePath(){ 
  const [path, setPath] = React.useState(location.pathname)
  
  React.useEffect(() => {
    const handlePopState = () => setPath(location.pathname)
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])
  
  return path 
}
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
  const [, forceUpdate] = React.useReducer(x => x + 1, 0)
  const role = getActiveRole()
  
  // Listen for localStorage changes (when Auth0 profile is fetched)
  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'primary_role' || e.key === 'active_role') {
        forceUpdate()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])
  
  // If no role yet, show loading instead of wrong dashboard
  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }
  
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

export default function App(){
  const path = usePath()
  if(path === '/admin') return <Protected roles={['admin']}><AdminDashboardPage /></Protected>
  if(path === '/callback') return <CallbackPage />
  if(path === '/email-verified') return <EmailVerificationSuccess />
  if(path.startsWith('/login')) return <LoginPage />
  if(path.startsWith('/events/new')) return <Protected roles={['organizer', 'admin']}><EventFormPage /></Protected>
  if(path.match(/^\/events\/\d+\/attendees$/)) return <Protected roles={['organizer', 'admin']}><EventAttendeesPage /></Protected>
  if(path.startsWith('/events/')) return <Protected roles={['organizer', 'admin']}><EventDetailPage /></Protected>
  if(path === '/checkin/start') return <CheckInStart />
  if(path.startsWith('/checkin')) return <CheckInPage />
  return <Protected><ProtectedDashboard /></Protected>
}
