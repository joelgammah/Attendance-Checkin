import { render, screen } from '@testing-library/react'
import EventDetailPage from '../pages/EventDetailPage'

vi.stubGlobal('fetch', vi.fn(async (input: any)=>{
  if(String(input).includes('/events/by-token/abc')){
    return new Response(JSON.stringify({ id:1, name:'E', location:'L', start_time: new Date().toISOString(), end_time: new Date(Date.now()+3600000).toISOString(), notes:null, checkin_open_minutes: 15, checkin_token:'abc', attendance_count:0 }), { headers: { 'content-type':'application/json' } })
  }
  return new Response('{}', { headers: { 'content-type':'application/json' } })
}))

vi.stubGlobal('location', { origin: 'http://localhost', pathname:'/events/abc' } as any)

vi.mock('../router', ()=> ({ useParams: ()=>({ token: 'abc' }) }))

it('renders QR page shell', async () => {
  render(<EventDetailPage />)
  expect(await screen.findByText('E')).toBeInTheDocument()
})
