import React from 'react'

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

export default function Protected({ children }: { children: React.ReactNode }){
  const authed = useAuth()
  if(!authed){ location.href = '/login'; return null }
  return <>{children}</>
}
