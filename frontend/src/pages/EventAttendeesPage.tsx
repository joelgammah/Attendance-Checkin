import React from 'react'
import { useParams } from '../App'
import Nav from '../components/Nav'
import { getEvent, getEventAttendees, downloadAttendanceCsv } from '../api/events'
import type { AttendeeOut } from '../api/events'

export default function EventAttendeesPage() {
  const { eventId } = useParams()
  const [attendees, setAttendees] = React.useState<AttendeeOut[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [eventName, setEventName] = React.useState<string>('')
  const [showNotification, setShowNotification] = React.useState(false)
  const [notificationMessage, setNotificationMessage] = React.useState('')

  // Show notification and auto-hide after 5 seconds
  const showSuccessNotification = (message: string) => {
    setNotificationMessage(message)
    setShowNotification(true)
    setTimeout(() => {
      setShowNotification(false)
    }, 7000)
  }

  React.useEffect(() => {
    if (!eventId) {
      setError('Event ID is required')
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        // Fetch event details and attendees in parallel
        const [eventData, attendeesData] = await Promise.all([
          getEvent(parseInt(eventId)),
          getEventAttendees(parseInt(eventId))
        ])
        
        setEventName(eventData.name)
        setAttendees(attendeesData)
      } catch (err) {
        console.error('Failed to load data:', err)
        setError('Failed to load event data. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [eventId])

  const handleExportCsv = async () => {
    if (!eventId) return
    
    try {
      await downloadAttendanceCsv(parseInt(eventId), eventName)
      showSuccessNotification(`Attendance report for "${eventName}" has been downloaded!`)
    } catch (err) {
      console.error('CSV download failed', err)
      showSuccessNotification('Failed to export CSV. Please try again.')
    }
  }

  if (loading) {
    return (
      <div>
        <Nav />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex items-center space-x-3">
            <svg className="animate-spin w-6 h-6" style={{color: '#95866A'}} fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-gray-600">Loading attendees...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <Nav />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{backgroundColor: 'rgba(239, 68, 68, 0.1)'}}>
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => location.href = '/dashboard'}
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => location.href = '/dashboard'}
                className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors duration-200"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div className="flex items-center justify-center w-16 h-16 rounded-xl" style={{backgroundColor: 'rgba(149, 134, 106, 0.1)'}}>
                <svg className="w-8 h-8" style={{color: '#95866A'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Event Attendees
                </h1>
                <p className="mt-2 text-gray-600">
                  {attendees.length} {attendees.length === 1 ? 'person has' : 'people have'} checked in{eventName ? ` - ${eventName}` : ''}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleExportCsv}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-lg transition-all duration-200"
                style={{backgroundColor: '#95866A'}}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#7d6f57' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#95866A' }}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {attendees.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No attendees yet</h3>
            <p className="text-gray-600">No one has checked into this event yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Attendee List</h2>
              <p className="text-sm text-gray-600 mt-1">
                Showing {attendees.length} {attendees.length === 1 ? 'attendee' : 'attendees'}
              </p>
            </div>
            
            <div className="divide-y divide-gray-200">
              {attendees.map((attendee, index) => (
                <div key={attendee.id} className="px-6 py-4 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full" style={{backgroundColor: 'rgba(149, 134, 106, 0.1)'}}>
                        <span className="text-sm font-medium" style={{color: '#95866A'}}>
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{attendee.attendee_name}</h3>
                        <p className="text-sm text-gray-600">{attendee.attendee_email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-900">
                        {new Date(attendee.checked_in_at).toLocaleString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <p className="text-xs text-gray-500">Checked in</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Success Notification Toast */}
      {showNotification && (
        <div className="fixed bottom-4 right-4 z-50" role="alert">
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
