import React from 'react'
import { getActiveRole } from '../api/auth'

export function useAuth(){
  const [authed, setAuthed] = React.useState<boolean>(!!localStorage.getItem('token'))
  React.useEffect(()=>{
    const onStorage = ()=> setAuthed(!!localStorage.getItem('token'))
    window.addEventListener('storage', onStorage)
    return ()=> window.removeEventListener('storage', onStorage)
  },[])
  return authed
}

export function Link(props: React.AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }){
  return <a {...props} href={props.to} className={"text-blue-600 hover:underline "+(props.className??'')} />
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
