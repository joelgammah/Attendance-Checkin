import React from 'react'
import { useSearch } from '../router'
import { checkIn } from '../api/attendance'
import { getByToken } from '../api/events'
import type { EventOut } from '../types'
import Protected from '../components/Protected'

export default function CheckInPage(){
  const { token } = useSearch()
  const [state, setState] = React.useState<'loading'|'event-found'|'checking-in'|'success'|'error'>('loading')
  const [msg, setMsg] = React.useState('')
  const [event, setEvent] = React.useState<EventOut | null>(null)
  const [checkInTime, setCheckInTime] = React.useState<string>('')

  React.useEffect(() => {
    (async () => {
      if (!token) {
        setState('error')
        setMsg('No event token provided')
        return
      }

      try {
        // First, get event details
        setState('loading')
        const eventData = await getByToken(token)
        setEvent(eventData)
        setState('event-found')
        
        // Small delay to show event info, then auto check-in
        setTimeout(async () => {
          try {
            setState('checking-in')
            await checkIn(token)
            setCheckInTime(new Date().toLocaleString())
            setState('success')
            setMsg('Successfully checked in!')
          } catch (e: any) {
            setState('error')
            setMsg(e.message || 'Failed to check in')
          }
        }, 1500)

      } catch (e: any) {
        setState('error')
        setMsg(e.message || 'Event not found')
      }
    })()
  }, [token])

  return (
    <Protected>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg" style={{backgroundColor: '#95866A'}}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Event Check-In</h1>
                <p className="text-gray-600">Terrier Check-In System</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            
            {/* Loading State */}
            {state === 'loading' && (
              <div className="p-12 text-center">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-full" style={{backgroundColor: 'rgba(149, 134, 106, 0.1)'}}>
                  <svg className="animate-spin w-8 h-8" style={{color: '#95866A'}} fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Finding Event</h2>
                <p className="text-gray-600">Please wait while we locate your event...</p>
              </div>
            )}

            {/* Event Found State */}
            {state === 'event-found' && event && (
              <div className="p-12 text-center">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-full" style={{backgroundColor: 'rgba(149, 134, 106, 0.1)'}}>
                  <svg className="w-8 h-8" style={{color: '#95866A'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{event.name}</h2>
                
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-gray-700">{event.location}</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-gray-700">
                        {new Date(event.start_time).toLocaleDateString()} at{' '}
                        {new Date(event.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-600">Preparing to check you in...</p>
              </div>
            )}

            {/* Checking In State */}
            {state === 'checking-in' && event && (
              <div className="p-12 text-center">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-full" style={{backgroundColor: 'rgba(149, 134, 106, 0.1)'}}>
                  <svg className="animate-spin w-8 h-8" style={{color: '#95866A'}} fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Checking You In</h2>
                <p className="text-gray-600">Almost done...</p>
              </div>
            )}

            {/* Success State */}
            {state === 'success' && event && (
              <div className="p-12 text-center">
                <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-full bg-green-100">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Check-In Successful!</h2>
                <p className="text-gray-600 mb-6">You've successfully checked into this event</p>
                
                <div className="bg-green-50 rounded-lg p-6 mb-8">
                  <h3 className="font-semibold text-green-800 mb-3">{event.name}</h3>
                  <div className="space-y-2 text-sm text-green-700">
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Checked in at: {checkInTime}</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{event.location}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <a
                    href="/attendee"
                    className="inline-flex items-center px-6 py-3 text-white font-medium rounded-lg transition-all duration-200 active:scale-95"
                    style={{backgroundColor: '#95866A'}}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#7d6f57';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#95866A';
                    }}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                    </svg>
                    Go to Dashboard
                  </a>
                  
                  <div>
                    <button
                      onClick={() => window.close()}
                      className="text-gray-600 hover:text-gray-900 text-sm transition-colors duration-200"
                    >
                      Close this window
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Error State */}
            {state === 'error' && (
              <div className="p-12 text-center">
                <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-full bg-red-100">
                  <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Check-In Failed</h2>
                <p className="text-gray-600 mb-6">We couldn't complete your check-in</p>
                
                <div className="bg-red-50 rounded-lg p-6 mb-8">
                  <p className="text-red-800 font-medium">{msg}</p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center px-6 py-3 text-white font-medium rounded-lg transition-all duration-200 active:scale-95"
                    style={{backgroundColor: '#95866A'}}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#7d6f57';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#95866A';
                    }}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Try Again
                  </button>
                  
                  <div>
                    <a
                      href="/attendee"
                      className="text-gray-600 hover:text-gray-900 text-sm transition-colors duration-200"
                    >
                      Go to Dashboard
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Protected>
  )
}