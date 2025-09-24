import React from 'react'
import { useSearch } from '../router'
import { checkIn } from '../api/events'
import Protected from '../components/Protected'

export default function CheckInPage(){
  const { token } = useSearch()
  const [state, setState] = React.useState<'idle'|'ok'|'err'>('idle')
  const [msg, setMsg] = React.useState('')
  React.useEffect(()=>{ (async()=>{
    try{ await checkIn(token); setState('ok'); setMsg('Checked in!') }
    catch(e:any){ setState('err'); setMsg(e.message) }
  })() },[token])
  return (
    <Protected>
      <div className="min-h-screen grid place-items-center p-4">
        <div className={`p-6 rounded-2xl shadow ${state==='ok'?'border-green-500 border':'border-gray-200 border'}`}>
          <h1 className="text-xl font-semibold mb-2">Event Check-In</h1>
          <p>{msg || 'Processing…'}</p>
        </div>
      </div>
    </Protected>
  )
}
