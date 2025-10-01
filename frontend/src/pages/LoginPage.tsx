import React from 'react'
import { login } from '../api/auth'

export default function LoginPage(){
  const [email, setEmail] = React.useState('grayj@wofford.edu')
  const [password, setPassword] = React.useState('grayj')
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  async function onSubmit(e: React.FormEvent){
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try{ 
      const loginData = await login(email, password)
      
      // Role-based routing
      if (loginData.role === 'attendee') {
        location.href = '/'  // Attendees go to their dashboard
      } else if (loginData.role === 'organizer' || loginData.role === 'admin') {
        location.href = '/'  // Organizers/admins go to main dashboard
      } else {
        location.href = '/'  // Default fallback
      }
    } catch(err: any) { 
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <form onSubmit={onSubmit} className="w-full max-w-md p-6 rounded-2xl shadow grid gap-3">
        <h1 className="text-2xl font-bold">Login</h1>
        {error && <div className="text-red-600 text-sm" role="alert">{error}</div>}
        <label className="grid gap-1">Email<input value={email} onChange={e=>setEmail(e.target.value)} className="border rounded p-2" /></label>
        <label className="grid gap-1">Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="border rounded p-2" /></label>
        <button disabled={loading} className={`mt-2 rounded p-2 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-800'} text-white`}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
        <p className="text-sm text-gray-600">Tip: password is the username part (before @)</p>
      </form>
    </div>
  )
}
