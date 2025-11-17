import React from 'react'
import { getActiveRole } from '../api/auth'
import { useAuth0 } from '@auth0/auth0-react'

export function useAuth(){
  const { isAuthenticated, isLoading } = useAuth0()
  const [authed, setAuthed] = React.useState<boolean>(!!localStorage.getItem('token') || isAuthenticated)
  
  React.useEffect(()=>{
    const onStorage = ()=> {
      const hasToken = !!localStorage.getItem('token')
      setAuthed(hasToken || isAuthenticated)
    }
    window.addEventListener('storage', onStorage)
    return ()=> window.removeEventListener('storage', onStorage)
  },[isAuthenticated])
  
  // Update when Auth0 loading state changes - trust Auth0 authentication
  React.useEffect(()=>{
    // If Auth0 is authenticated OR we have a localStorage token, consider user authenticated
    const newAuthed = isAuthenticated || !!localStorage.getItem('token')
    setAuthed(newAuthed)
  },[isAuthenticated, isLoading])
  
  // FIX: Return loading state so Protected can wait for Auth0
  return { authed, isCheckingAuth: isLoading }
}

export function Link(props: React.AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }){
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    // Use history.pushState to preserve Auth0 authentication state
    history.pushState({}, '', props.to)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }
  
  return (
    <a 
      {...props} 
      href={props.to} 
      onClick={handleClick}
      className={"text-blue-600 hover:underline "+(props.className??'')} 
    />
  )
}

interface ProtectedProps {
  children: React.ReactNode
  roles?: string[]  // Optional role restriction
}

export default function Protected({ children, roles }: ProtectedProps){
  const { authed, isCheckingAuth } = useAuth()
  const activeRole = getActiveRole()
  
  // ALL HOOKS MUST BE AT THE TOP - before any conditional returns!
  // Redirect to login if not authenticated (using useEffect to avoid render-phase state updates)
  React.useEffect(() => {
    if (!authed && !isCheckingAuth) {
      history.pushState({}, '', '/login')
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
  }, [authed, isCheckingAuth])
  
  // Redirect if insufficient role permissions
  React.useEffect(() => {
    if (authed && !isCheckingAuth && roles && activeRole && !roles.includes(activeRole)) {
      history.pushState({}, '', '/')
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
  }, [authed, isCheckingAuth, roles, activeRole])
  
  // CRITICAL FIX: Wait for Auth0 to finish loading before making decisions
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }
  
  // Check if logged in (existing logic)
  if(!authed){ 
    return null 
  }
  
  // Check role permissions if specified
  if (roles && activeRole && !roles.includes(activeRole)) {
    return null
  }
  
  return <>{children}</>
}
