import React from 'react'
import { useParams } from '../App'
import { Link } from '../components/Protected'
import { useAuth0 } from '@auth0/auth0-react'
import RoleSwitch from '../components/RoleSwitch'
import { logout } from '../api/auth'

import { 
  getMyEventDetails, 
  MyEventDetails 
} from '../api/attendance'

export default function AttendeeEventOverview() {
  const { parentId } = useParams()
  const { isAuthenticated, logout: auth0Logout } = useAuth0()

  const [details, setDetails] = React.useState<MyEventDetails | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [userEmail, setUserEmail] = React.useState('Student')

  React.useEffect(() => {
    async function loadData() {
      try {
        const storedEmail = localStorage.getItem('user_email')
        setUserEmail(storedEmail ? storedEmail : 'Student')

        if (!parentId) return
        const data = await getMyEventDetails(Number(parentId))
        setDetails(data)
      } catch (err) {
        console.error('Failed to load event details', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [parentId])

  if (loading || !details) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading event details...</p>
      </div>
    )
  }

  const { parent, next_session, attended, missed, flagged, total_past_sessions } = details
  const past = details.past_sessions
  const upcoming = details.upcoming_sessions

  return (
    <div className="min-h-screen bg-gray-50">

      {/* NAV BAR (same as attendee dashboard) */}
      <nav className="w-full flex items-center justify-between p-6 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-lg"
            style={{ backgroundColor: '#95866A' }}
          >
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Terrier Check-In</h1>
        </div>

        <div className="flex items-center space-x-1">
          <div className="mr-4">
            <RoleSwitch />
          </div>

          <Link
            to="/"
            className="px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:text-gray-900 transition-colors duration-200"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(149, 134, 106, 0.1)'
              e.currentTarget.style.color = '#95866A'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = '#374151'
            }}
          >
            Dashboard
          </Link>

          <Link
            to="/checkin/start"
            className="px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:text-gray-900 transition-colors duration-200"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(149, 134, 106, 0.1)'
              e.currentTarget.style.color = '#95866A'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = '#374151'
            }}
          >
            Check In
          </Link>

          <div className="h-6 w-px bg-gray-300 mx-2"></div>

          <button
            onClick={() => {
              if (isAuthenticated) {
                localStorage.clear()
                auth0Logout({ logoutParams: { returnTo: window.location.origin } })
              } else {
                logout()
                location.href = '/login'
              }
            }}
            className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-all duration-200 active:scale-95"
            style={{ backgroundColor: '#95866A' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#7d6f57')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#95866A')}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* HEADER SECTION */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {parent.name}
          </h1>
          <p className="text-gray-600 mt-2">{parent.location}</p>

          <div className="mt-4 flex items-center space-x-4">
            <span className="px-3 py-1 text-sm rounded-full" style={{ backgroundColor: 'rgba(149,134,106,0.1)', color: '#95866A' }}>
              {attended}/{total_past_sessions} attended
            </span>

            {flagged && (
              <span className="px-3 py-1 text-sm rounded-full bg-red-100 text-red-600 font-medium">
                ⚠ Flagged
              </span>
            )}

            {parent.attendance_threshold !== null && (
              <span className="text-sm text-gray-500">
                Threshold: {parent.attendance_threshold} absences
              </span>
            )}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-5xl mx-auto px-6 py-10 grid gap-8 lg:grid-cols-2">

        {/* Upcoming Sessions */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Upcoming Sessions</h2>

          {upcoming.length === 0 ? (
            <p className="text-gray-500 italic">No upcoming sessions</p>
          ) : (
            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
              {upcoming.map((s) => (
                <div
                  key={s.session.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                >
                  <h3 className="font-semibold text-gray-900">{parent.name}</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(s.session.start_time).toLocaleDateString()} —{' '}
                    {new Date(s.session.start_time).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Past Sessions */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Past Sessions</h2>

          {past.length === 0 ? (
            <p className="text-gray-500 italic">No past sessions</p>
          ) : (
            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
              {past.map((s) => {
                const wasAttended = s.attended
                return (
                  <div
                    key={s.session.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <h3 className="font-semibold text-gray-900">{parent.name}</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(s.session.start_time).toLocaleDateString()} —{' '}
                        {new Date(s.session.start_time).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>

                    <div>
                      {wasAttended ? (
                        <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-600 font-medium">
                          ✓ Attended
                        </span>
                      ) : (
                        <span className="px-3 py-1 text-xs rounded-full bg-red-100 text-red-600 font-medium">
                          ✗ Missed
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
