import React from 'react'
import { getActiveRole } from '../api/auth'
import { useAuth0 } from '@auth0/auth0-react'

export function useAuth(){
  const { isAuthenticated, isLoading } = useAuth0()
  const [authed, setAuthed] = React.useState<boolean>(!!localStorage.getItem('token') || isAuthenticated)
  
  React.useEffect(()=>{
    const onStorage = ()=> setAuthed(!!localStorage.getItem('token') || isAuthenticated)
    window.addEventListener('storage', onStorage)
    return ()=> window.removeEventListener('storage', onStorage)
  },[isAuthenticated])
  
  // Update when Auth0 loading state changes - trust Auth0 authentication
  React.useEffect(()=>{
    console.log('DEBUG: useAuth() - Auth0 state:', { isAuthenticated, isLoading, hasLocalToken: !!localStorage.getItem('token') })
    // If Auth0 is authenticated OR we have a localStorage token, consider user authenticated
    setAuthed(isAuthenticated || !!localStorage.getItem('token'))
  },[isAuthenticated, isLoading])
  
  return authed
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
  const authed = useAuth()
  const activeRole = getActiveRole()
  
  // Check if logged in (existing logic)
  if(!authed){ 
    location.href = '/login'
    return null 
  }
  
  // Check role permissions if specified
  if (roles && activeRole && !roles.includes(activeRole)) {
    location.href = '/'  // Redirect to dashboard
    return null
  }
  
  return <>{children}</>
}
