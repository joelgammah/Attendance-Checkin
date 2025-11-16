import React from 'react'
import Nav from '../components/Nav' 
import { myUpcoming, myPast, csvUrl, downloadAttendanceCsv } from '../api/events' // ADD downloadAttendanceCsv
import type { EventOut } from '../types'
import { Link } from '../components/Protected'

export default function DashboardPage(){
  const [upcoming, setUpcoming] = React.useState<EventOut[]>([])
  const [past, setPast] = React.useState<EventOut[]>([])
  const [loading, setLoading] = React.useState(true)
  const [showNotification, setShowNotification] = React.useState(false)
  const [notificationMessage, setNotificationMessage] = React.useState('')
  const [expandedUpcoming, setExpandedUpcoming] = React.useState(false)
  const [expandedPast, setExpandedPast] = React.useState(false)

  // Show notification and auto-hide after 5 seconds
  const showSuccessNotification = (message: string) => {
    setNotificationMessage(message)
    setShowNotification(true)
    setTimeout(() => {
      setShowNotification(false)
    }, 7000)
  }

  React.useEffect(()=>{ 
    (async()=>{ 
      try {
        const [upcomingEvents, pastEvents] = await Promise.all([
          myUpcoming(), 
          myPast()
        ])
        setUpcoming(upcomingEvents)
        setPast(pastEvents)
      } catch (error) {
        console.error('Failed to load events:', error)
      } finally {
        setLoading(false)
      }
    })() 
  },[])

  const handleCsvClick = React.useCallback((id: number, eventName: string) => async (e: React.MouseEvent) => {
    e.preventDefault()
    try {
      await downloadAttendanceCsv(id, eventName)
      showSuccessNotification(`Attendance report for "${eventName}" has been downloaded!`)
    } catch (err) {
      console.error('CSV download failed', err)
      showSuccessNotification('Failed to export CSV. Please try again.')
    }
  }, [showSuccessNotification])

  const upcomingToDisplay = expandedUpcoming ? upcoming : upcoming.slice(0, 5)
  const pastToDisplay = expandedPast ? past : past.slice(0, 5)

  if (loading) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-xl" style={{backgroundColor: 'rgba(149, 134, 106, 0.1)'}}>
              <svg className="w-8 h-8" style={{color: '#95866A'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome {localStorage.getItem('user_email')?.split('@')[0] || 'Organizer'}!
              </h1>
              <p className="mt-2 text-gray-600">Manage your events and track attendance</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-8">
          
          {/* Upcoming Events Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg" style={{backgroundColor: 'rgba(149, 134, 106, 0.1)'}}>
                  <svg className="w-5 h-5" style={{color: '#95866A'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Upcoming Events</h2>
              </div>
              <div className="flex items-center space-x-3">
                <span className="px-3 py-1 text-sm font-medium rounded-full" style={{backgroundColor: 'rgba(149, 134, 106, 0.1)', color: '#95866A'}}>
                  {upcoming.length} events
                </span>
                {upcoming.length > 5 && (
                  <button
                    onClick={() => setExpandedUpcoming(!expandedUpcoming)}
                    className="px-3 py-1 text-sm font-medium rounded-full transition-all duration-200 hover:opacity-80"
                    style={{backgroundColor: 'rgba(149, 134, 106, 0.1)', color: '#95866A'}}
                  >
                    {expandedUpcoming ? 'View Less' : 'View All'}
                  </button>
                )}
              </div>
            </div>
            <EventList items={upcomingToDisplay} />
          </section>

          {/* Past Events Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg" style={{backgroundColor: 'rgba(149, 134, 106, 0.1)'}}>
                  <svg className="w-5 h-5" style={{color: '#95866A'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Past Events</h2>
              </div>
              <div className="flex items-center space-x-3">
                <span className="px-3 py-1 text-sm font-medium rounded-full" style={{backgroundColor: 'rgba(149, 134, 106, 0.1)', color: '#95866A'}}>
                  {past.length} events
                </span>
                {past.length > 5 && (
                  <button
                    onClick={() => setExpandedPast(!expandedPast)}
                    className="px-3 py-1 text-sm font-medium rounded-full transition-all duration-200 hover:opacity-80"
                    style={{backgroundColor: 'rgba(149, 134, 106, 0.1)', color: '#95866A'}}
                  >
                    {expandedPast ? 'View Less' : 'View All'}
                  </button>
                )}
              </div>
            </div>
            <EventList items={pastToDisplay} showCsv onCsv={handleCsvClick} />
          </section>
        </div>
      </div>

      {/* Success Notification Toast */}
      {showNotification && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 flex items-center space-x-3 max-w-sm">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{backgroundColor: 'rgba(34, 197, 94, 0.1)'}}>
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{notificationMessage}</p>
            </div>
            <button 
              onClick={() => setShowNotification(false)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              aria-label="Close notification"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function EventList(
  { items, showCsv=false, onCsv } : {
    items: EventOut[]
    showCsv?: boolean
    onCsv?: (id:number, eventName:string)=>(e:React.MouseEvent)=>void | Promise<void>
  }
){
  if(items.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
        <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming events</h3>
        <p className="text-gray-600 mb-6">Get started by creating an event</p>
        <Link
          to="/events/new"
          className="inline-flex items-center px-4 py-2 text-white font-medium rounded-lg transition-all duration-200"
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
          Create Event
        </Link>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {items.map(e=> (
        <div key={e.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-start justify-between">
            {/* Event Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 pr-4 flex items-center gap-2">
                  {e.name}
                  {e.recurring && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold" style={{backgroundColor: 'rgba(34,197,94,0.12)', color: '#059669', marginLeft: 4}}>
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Recurring
                    </span>
                  )}
                </h3>
                <div className="flex items-center space-x-2 text-sm">
                  <button
                    onClick={() => {
                      console.log('� [DashboardPage] "View Attendees" button clicked:', e.id)
                      history.pushState({}, '', `/events/${e.id}/attendees`)
                      window.dispatchEvent(new PopStateEvent('popstate'))
                    }}
                    className="px-2 py-1 rounded-full text-xs font-medium cursor-pointer transition-all duration-200 hover:shadow-sm"
                    style={{backgroundColor: 'rgba(149, 134, 106, 0.1)', color: '#95866A'}} 
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(149, 134, 106, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(149, 134, 106, 0.1)';
                    }}
                  >
                    {e.attendance_count} attendees
                  </button>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>
                    {new Date(e.start_time).toLocaleString(undefined, {
                      year: 'numeric',
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })} 
                    {' '} – {' '}
                    {new Date(e.end_time).toLocaleString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric', 
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{e.location}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3 ml-4">
              {new Date() <= new Date(e.end_time) ? (
                <Link 
                  to={`/events/${e.checkin_token}`}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 border border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-900" 
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
                  </svg>
                  Show QR
                </Link>
              ) : (
                <span className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-500 border border-gray-200">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Check In ended
                </span>
              )}
              
              {showCsv && (
                <a
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-lg transition-all duration-200"
                  style={{backgroundColor: '#95866A'}}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#7d6f57' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#95866A' }}
                  href={csvUrl(e.id)}
                  onClick={(event) => {
                    if (onCsv) {
                      onCsv(e.id, e.name)(event)
                    }
                  }}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export CSV
                </a>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}