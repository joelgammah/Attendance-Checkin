import React from 'react'
import { useParams } from '../router'
import Nav from '../components/Nav'
import { getByToken } from '../api/events'
import type { EventOut } from '../types'
import QRCode from 'qrcode'

export default function EventDetailPage() {
  const { token } = useParams()
  const [event, setEvent] = React.useState<EventOut | null>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)

  // Fetch event details when the component mounts
  React.useEffect(() => {
    (async () => {
      const e = await getByToken(token)
      setEvent(e)
    })()
  }, [token])

  // Generate the QR code after the event is loaded
  React.useEffect(() => {
    if (event && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        `${location.origin}/checkin?token=${event.checkin_token}`
      )
    }
  }, [event]) // Only run this effect when `event` changes

  if (!event) return <div>Loading…</div>
  return (
    <div>
      <Nav />
      <div className="p-4 grid gap-4 place-items-center">
        <h1 className="text-2xl font-bold">{event.name}</h1>
        <div className="text-gray-600">Scan to check in</div>
        <canvas ref={canvasRef} className="bg-white p-4 rounded"></canvas>
        <div className="text-sm">
          {new Date(event.start_time).toLocaleString()} –{' '}
          {new Date(event.end_time).toLocaleString()} @ {event.location}
        </div>
      </div>
    </div>
  )
}
