import React from 'react'
import { Link } from '../components/Protected'
import { useAuth0 } from '@auth0/auth0-react'
import RoleSwitch from '../components/RoleSwitch'
import { logout } from '../api/auth'
import { getMyCheckIns, getMyEvents, MyCheckIn, MyEventSummary } from '../api/attendance'

// -------------------------------------------------------
// COMPONENT: My Events (left side)
// -------------------------------------------------------
function MyEventsCard({ groups }: { groups: MyEventSummary[] }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div
          className="flex items-center justify-center w-12 h-12 rounded-lg"
          style={{ backgroundColor: 'rgba(149, 134, 106, 0.1)' }}
        >
          <svg
            className="w-6 h-6"
            style={{ color: '#95866A' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">My Events</h2>
      </div>

      {groups.length === 0 ? (
        <p className="text-gray-600">You are not a member of any events yet.</p>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {groups.map((g) => (
            <div
              key={g.parent.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors duration-200 cursor-pointer"
              onClick={() => {
                history.pushState({}, '', `/attendee/events/${g.parent.id}`)
                window.dispatchEvent(new PopStateEvent('popstate'))
              }}
            >
              <div className="mb-2">
                <h3 className="font-semibold text-gray-900 text-lg">
                  {g.parent.name}
                </h3>
                <p className="text-sm text-gray-600">{g.parent.location}</p>
              </div>

              {g.next_session ? (
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Next session:</span>{' '}
                  {new Date(g.next_session.start_time).toLocaleDateString()} at{' '}
                  {new Date(g.next_session.start_time).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              ) : (
                <p className="text-sm text-gray-500 italic">No upcoming sessions</p>
              )}

              <p className="text-xs mt-2 text-gray-500">
                {g.total_past_sessions} total sessions so far
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// -------------------------------------------------------
// MAIN PAGE
// -------------------------------------------------------
export default function AttendeeDashboard() {
  const { isAuthenticated, logout: auth0Logout } = useAuth0()
  const [checkIns, setCheckIns] = React.useState<MyCheckIn[]>([])
  const [allCheckIns, setAllCheckIns] = React.useState<MyCheckIn[] | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [userEmail, setUserEmail] = React.useState('')
  const [showAll, setShowAll] = React.useState(false)
  const [hasMore, setHasMore] = React.useState(false)

  const [myEvents, setMyEvents] = React.useState<MyEventSummary[]>([])
  const [eventsLoading, setEventsLoading] = React.useState(true)

  React.useEffect(() => {
    async function loadData() {
      try {
        // Get user email
        const storedEmail = localStorage.getItem('user_email')
        setUserEmail(storedEmail ? storedEmail : 'Student')

        // Load check-ins
        const data = await getMyCheckIns()
        setCheckIns(data.slice(0, 5))
        setHasMore(data.length > 5)

        // Load events (groups)
        const groups = await getMyEvents()
        setMyEvents(groups)
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setLoading(false)
        setEventsLoading(false)
      }
    }
    loadData()
  }, [])

  // Expand/collapse check-ins
  const handleToggleCheckIns = async () => {
    if (!showAll && allCheckIns === null) {
      try {
        setLoading(true)
        const data = await getMyCheckIns()
        setAllCheckIns(data)
      } catch (error) {
        setAllCheckIns([])
      } finally {
        setLoading(false)
      }
    }
    setShowAll((prev) => !prev)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* NAV BAR */}
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
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Terrier Check-In</h1>
          </div>
        </div>

        {/* NAV ITEMS */}
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
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
              </svg>
              <span>Dashboard</span>
            </div>
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
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
              </svg>
              <span>Check In</span>
            </div>
          </Link>

          {/* Divider */}
          <div className="h-6 w-px bg-gray-300 mx-2"></div>

          {/* Logout */}
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
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#7d6f57'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#95866A'
            }}
          >
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span>Logout</span>
            </div>
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center space-x-4">
            <div
              className="flex items-center justify-center w-16 h-16 rounded-xl"
              style={{ backgroundColor: 'rgba(149, 134, 106, 0.1)' }}
            >
              <svg
                className="w-8 h-8"
                style={{ color: '#95866A' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome {userEmail.split('@')[0]}!
              </h1>
              <p className="mt-2 text-gray-600">
                View your event memberships and check-in history.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* LEFT: My Events */}
          <MyEventsCard groups={myEvents} />

          {/* RIGHT: Recent Check-ins */}
          {/* <=== This entire block remains unchanged; paste your original here ===> */}
          {/* I intentionally did not rewrite it to avoid regression errors */}
          {/* Just leave your existing "Recent Check-Ins Card" exactly as-is */}
                    {/* Recent Check-ins Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg" style={{backgroundColor: 'rgba(149, 134, 106, 0.1)'}}>
                  <svg className="w-6 h-6" style={{color: '#95866A'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Recent Check-ins</h2>
              </div>
              <span className="px-3 py-1 text-sm font-medium rounded-full" style={{backgroundColor: 'rgba(149, 134, 106, 0.1)', color: '#95866A'}}>
                {checkIns.length} recent
              </span>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center space-x-3">
                  <svg className="animate-spin w-5 h-5" style={{color: '#95866A'}} fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-gray-600">Loading your check-ins...</span>
                </div>
              </div>
            ) : (showAll ? (allCheckIns || []).length > 0 : checkIns.length > 0) ? (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {(showAll ? allCheckIns || [] : checkIns).map((checkIn) => (
                  <div key={checkIn.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors duration-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-2 h-2 rounded-full" style={{backgroundColor: '#95866A'}}></div>
                          <h3 className="font-semibold text-gray-900">{checkIn.event_name}</h3>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>{checkIn.event_location}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>
                              Checked in: {new Date(checkIn.checked_in_at).toLocaleDateString()} at{' '}
                              {new Date(checkIn.checked_in_at).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="px-2 py-1 text-xs font-medium rounded-full" style={{backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#059669'}}>
                          ✓ Checked In
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {(!showAll && hasMore) || (showAll && (allCheckIns && allCheckIns.length > 5)) ? (
                  <button
                    className="w-full text-center py-3 text-sm font-medium rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors duration-200"
                    style={{color: '#95866A'}}
                    onClick={handleToggleCheckIns}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#95866A';
                      e.currentTarget.style.backgroundColor = 'rgba(149, 134, 106, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#d1d5db';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {showAll ? 'View less' : 'View all check-ins →'}
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No check-ins yet</h3>
                <p className="text-gray-600 mb-4">Start checking into events to see your attendance history here.</p>
                <Link
                  to="/checkin/start"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-lg transition-all duration-200"
                  style={{backgroundColor: '#95866A'}}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#7d6f57';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#95866A';
                  }}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Check into your first event
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
