import React from 'react'
import Nav from '../components/Nav'
import { useParams } from '../App'
import { getEventFamily } from '../api/events'
import { csvUrl } from '../api/events'
import type { EventFamilyResponse, MemberAttendanceSummary } from '../types'

// =====================================================
// LEFT SIDE: SESSION LIST
// =====================================================

function SessionList({
  family,
  selectedSessionId,
  onSelect
}: {
  family: EventFamilyResponse
  selectedSessionId: number | null
  onSelect: (id: number) => void
}) {
  const now = new Date()
  const parentIsPast = new Date(family.parent.end_time) < now

  return (
    <div className="w-1/3 min-w-[360px] border-r border-gray-200 bg-white overflow-y-auto">

      {/* ------------ Parent Session ------------- */}
      <div
        onClick={() => onSelect(family.parent.id)}
        className={`p-5 cursor-pointer ${
          selectedSessionId === family.parent.id ? 'bg-gray-100' : ''
        }`}
      >
        <div className="flex justify-between items-start">

          {/* Left info column */}
          <div>
            <div className="font-bold text-5xl text-gray-900">{family.parent.name}</div>
            <div className="text-sm text-gray-700">{family.parent.location}</div>

            <div className="text-xs text-gray-500 mt-1">
              {new Date(family.parent.start_time).toLocaleString()} –{' '}
              {new Date(family.parent.end_time).toLocaleString()}
            </div>

            <span className="inline-block mt-2 text-xs px-2 py-1 rounded bg-gray-200 text-gray-700">
              Parent Session
            </span>
          </div>

          {/* Parent Action Buttons */}
          <div className="flex flex-col gap-2 ml-4">

            {/* QR only if future */}
            {!parentIsPast && (
              <a
                href={`/events/${family.parent.checkin_token}`}
                className="inline-flex items-center justify-center px-4 py-2 min-w-[110px]
                            text-sm font-medium rounded-lg transition-all duration-200 
                            border border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-900"
              >
                Show QR
              </a>
            )}

            {/* Attendees */}
            <a
              href={`/events/${family.parent.id}/attendees`}
              className="px-3 py-1 rounded-full text-xs font-medium cursor-pointer 
                         transition-all duration-200 hover:shadow-sm text-center"
              style={{ backgroundColor: 'rgba(149, 134, 106, 0.1)', color: '#95866A' }}
            >
              {family.parent.attendance_count ?? 0} attendees
            </a>

            {/* CSV if past */}
            {parentIsPast && (
              <a
                className="inline-flex items-center justify-center 
             px-4 py-2 min-w-[110px]
             text-sm font-medium 
             rounded-lg 
             transition-all duration-200
             text-white"
                style={{ backgroundColor: '#95866A' }}
                href={csvUrl(family.parent.id)}
              >
                Export CSV
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ------------ Upcoming Sessions ------------- */}
      <div className="px-4 py-3 text-sm uppercase font-bold text-gray-700 tracking-wide">
        Upcoming Sessions
      </div>

      {family.upcoming_children.map((s) => (
        <div
          key={s.id}
          onClick={() => onSelect(s.id)}
          className={`p-5 cursor-pointer ${
            selectedSessionId === s.id ? 'bg-gray-100' : ''
          }`}
        >
          <div className="flex justify-between items-start">
            {/* Info */}
            <div>
              <div className="text-sm text-gray-800">
                {new Date(s.start_time).toLocaleDateString()}
              </div>
              <div className="text-xs text-gray-600">
                {new Date(s.start_time).toLocaleTimeString()} –{' '}
                {new Date(s.end_time).toLocaleTimeString()}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-2">

              <a
                href={`/events/${s.checkin_token}`}
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg 
                           transition-all duration-200 border border-gray-300 
                           hover:border-gray-400 hover:bg-gray-50 text-gray-900"
              >
                Show QR
              </a>

              <a
                href={`/events/${s.id}/attendees`}
                className="px-3 py-1 rounded-full text-xs font-medium cursor-pointer 
                           transition-all duration-200 hover:shadow-sm text-center"
                style={{ backgroundColor: 'rgba(149, 134, 106, 0.1)', color: '#95866A' }}
              >
                Attendance
              </a>
            </div>
          </div>
        </div>
      ))}

      {/* ------------ Past Sessions ------------- */}
      <div className="px-4 py-3 text-sm uppercase font-bold text-gray-700 tracking-wide">
        Past Sessions
      </div>

      {family.past_children.map((s) => (
        <div
          key={s.id}
          onClick={() => onSelect(s.id)}
          className={`p-5 cursor-pointer ${
            selectedSessionId === s.id ? 'bg-gray-100' : ''
          }`}
        >
          <div className="flex justify-between items-start">

            <div>
              <div className="text-sm text-gray-800">
                {new Date(s.start_time).toLocaleDateString()}
              </div>
              <div className="text-xs text-gray-600">
                {new Date(s.start_time).toLocaleTimeString()} –{' '}
                {new Date(s.end_time).toLocaleTimeString()}
              </div>
            </div>

            <div className="flex flex-col gap-2">

              {/* CSV Export */}
              <a
                className="iinline-flex items-center justify-center 
             px-4 py-2 min-w-[110px]
             text-sm font-medium 
             rounded-lg 
             transition-all duration-200
             text-white"
                style={{ backgroundColor: '#95866A' }}
                href={csvUrl(s.id)}
              >
                Export CSV
              </a>

              <a
                href={`/events/${s.id}/attendees`}
                className="px-3 py-1 rounded-full text-xs font-medium cursor-pointer 
                           transition-all duration-200 hover:shadow-sm text-center min-w-[110px]"
                style={{ backgroundColor: 'rgba(149, 134, 106, 0.1)', color: '#95866A' }}
              >
                Attendance
              </a>

            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// =====================================================
// RIGHT SIDE (Members)
// =====================================================

function MembersTable({ members }: { members: MemberAttendanceSummary[] }) {
  return (
    <table className="w-full border-collapse mt-6 bg-white shadow-sm rounded-lg">
      <thead>
        <tr className="text-left border-b bg-gray-100 text-gray-700">
          <th className="py-2 px-3">Name</th>
          <th className="py-2 px-3">Email</th>
          <th className="py-2 px-3">Attended</th>
          <th className="py-2 px-3">Missed</th>
          <th className="py-2 px-3">Status</th>
        </tr>
      </thead>
      <tbody>
        {members.map((m) => (
          <tr key={m.user_id} className="border-b">
            <td className="py-2 px-3">{m.name}</td>
            <td className="py-2 px-3 text-gray-600">{m.email}</td>
            <td className="py-2 px-3">{m.attended}</td>
            <td className="py-2 px-3">{m.missed}</td>
            <td className="py-2 px-3">
              {m.is_flagged ? (
                <span className="text-red-600 font-semibold">⚠ Flagged</span>
              ) : (
                <span className="text-green-600">OK</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// =====================================================
// MAIN PAGE COMPONENT
// =====================================================

export default function EventFamilyPage() {
  const { eventId } = useParams()

  const [family, setFamily] = React.useState<EventFamilyResponse | null>(null)
  const [selectedSessionId, setSelectedSessionId] = React.useState<number | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!eventId) {
      setError("Event ID is missing")
      setLoading(false)
      return
    }

    const load = async () => {
      try {
        const data = await getEventFamily(Number(eventId))
        setFamily(data)
        setSelectedSessionId(data.parent.id)
      } catch (err) {
        console.error(err)
        setError("Failed to load event series")
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [eventId])

  if (loading) {
    return (
      <div>
        <Nav />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex items-center space-x-3">
            <svg className="animate-spin w-6 h-6" style={{ color: '#95866A' }} fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-gray-600">Loading series...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !family) {
    return (
      <div>
        <Nav />
        <div className="p-6 text-red-600">{error ?? "Failed to load"}</div>
      </div>
    )
  }

  return (
    <div>
      <Nav />

      <div className="flex h-[calc(100vh-64px)]">
        
        {/* LEFT PANEL */}
        <SessionList
          family={family}
          selectedSessionId={selectedSessionId}
          onSelect={setSelectedSessionId}
        />

        {/* RIGHT PANEL */}
        <div className="flex-1 p-8 overflow-y-auto bg-gray-50">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Event Members</h1>

          <p className="text-gray-700 mb-1">
            Attendance across <strong>{family.total_past_sessions}</strong> completed sessions
          </p>

          {family.parent.attendance_threshold !== null && (
            <p className="text-sm text-gray-600 mb-4">
              Attendance Threshold:{" "}
              <span className="font-semibold">{family.parent.attendance_threshold}</span>
            </p>
          )}

          <MembersTable members={family.members} />
        </div>

      </div>
    </div>
  )
}
