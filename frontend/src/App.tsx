import React from 'react'
import Protected from './components/Protected'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import AttendeeDashboard from './pages/AttendeeDashboard'
import EventFormPage from './pages/EventFormPage'
import EventDetailPage from './pages/EventDetailPage'
import CheckInPage from './pages/CheckInPage'
import { getUserRole } from './api/auth'

// Minimal router helpers
function usePath(){ return location.pathname }
export function useParams(){
  const path = usePath()
  const m = path.match(/\/events\/(.+)$/)
  return { token: m? m[1]: '' }
}
export function useSearch(){
  const p = new URLSearchParams(location.search)
  return { token: p.get('token') || '' }
}

export { useParams as useParams_compat, useSearch as useSearch_compat }

function ProtectedDashboard() {
  const role = getUserRole()
  
  // Route based on user role
  if (role === 'attendee') {
    return <AttendeeDashboard />
  } else {
    // organizer, admin, or fallback
    return <DashboardPage />
  }
}

export default function App(){
  const path = usePath()
  if(path.startsWith('/login')) return <LoginPage />
  if(path.startsWith('/events/new')) return <Protected><EventFormPage /></Protected>
  if(path.startsWith('/events/')) return <Protected><EventDetailPage /></Protected>
  if(path.startsWith('/checkin')) return <CheckInPage />
  return <Protected><ProtectedDashboard /></Protected>
}
