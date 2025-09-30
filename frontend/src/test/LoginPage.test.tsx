import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LoginPage from '../pages/LoginPage'

vi.stubGlobal('fetch', vi.fn(async (input: any, init?: any)=>{
  if(String(input).includes('/auth/login')) return new Response(JSON.stringify({ access_token:'t', token_type: 'bearer', role: 'organizer' }), { headers: { 'content-type':'application/json' } })
  return new Response('{}', { headers: { 'content-type':'application/json' } })
}))

vi.stubGlobal('location', { href: '/', origin: 'http://localhost' } as any)

it('logs in with demo creds', async () => {
  render(<LoginPage />)
  fireEvent.click(screen.getByText('Sign in'))
  await waitFor(()=> expect(localStorage.getItem('token')).toBe('t'))
  await waitFor(()=> expect(localStorage.getItem('role')).toBe('organizer'))
})
