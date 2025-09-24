import React from 'react'
import Nav from '../components/Nav'
import { myUpcoming, myPast, csvUrl } from '../api/events'
import type { EventOut } from '../types'

export default function DashboardPage(){
  const [upcoming, setUpcoming] = React.useState<EventOut[]>([])
  const [past, setPast] = React.useState<EventOut[]>([])
  React.useEffect(()=>{ (async()=>{ setUpcoming(await myUpcoming()); setPast(await myPast()) })() },[])

  return (
    <div>
      <Nav />
      <div className="p-4 grid gap-6">
        <section>
          <h2 className="text-xl font-semibold mb-2">Upcoming Events</h2>
          <EventList items={upcoming} />
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-2">Past Events</h2>
          <EventList items={past} showCsv />
        </section>
      </div>
    </div>
  )
}

function EventList({ items, showCsv=false }: { items: EventOut[]; showCsv?: boolean }){
  if(items.length===0) return <div className="text-gray-600">No events yet.</div>
  return (
    <ul className="grid gap-3">
      {items.map(e=> (
        <li key={e.id} className="border rounded-xl p-3 flex items-center justify-between">
          <div>
            <div className="font-medium">{e.name}</div>
            <div className="text-sm text-gray-600">{new Date(e.start_time).toLocaleString()} – {new Date(e.end_time).toLocaleString()} @ {e.location}</div>
            <div className="text-sm">Attendance: {e.attendance_count}</div>
          </div>
          <div className="flex gap-2">
            <a className="px-3 py-1 rounded bg-gray-100" href={`/events/${e.checkin_token}`}>Show QR</a>
            {showCsv && <a className="px-3 py-1 rounded bg-gray-100" href={csvUrl(e.id)}>Export CSV</a>}
          </div>
        </li>
      ))}
    </ul>
  )
}
