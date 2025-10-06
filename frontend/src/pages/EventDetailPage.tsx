import React from 'react'
import { useParams } from '../router'
import Nav from '../components/Nav'
import { getByToken } from '../api/events'
import type { EventOut } from '../types'
import QRCode from 'qrcode'

export default function EventDetailPage() {
  const { token } = useParams()
  const [event, setEvent] = React.useState<EventOut | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')
  const canvasRef = React.useRef<HTMLCanvasElement>(null)

  // Fetch event details when the component mounts
  React.useEffect(() => {
    (async () => {
      try {
        const e = await getByToken(token)
        setEvent(e)
      } catch (err: any) {
        setError(err.message || 'Failed to load event')
      } finally {
        setLoading(false)
      }
    })()
  }, [token])

  // Generate the QR code after the event is loaded
  React.useEffect(() => {
    if (event && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        `${location.origin}/checkin?token=${event.checkin_token}`,
        {
          width: 256,
          margin: 2,
          color: {
            dark: '#1f2937', // Dark gray for better readability
            light: '#ffffff'
          }
        }
      )
    }
  }, [event])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Nav />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex items-center space-x-3">
            <svg className="animate-spin w-6 h-6" style={{color: '#95866A'}} fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-gray-600">Loading event details...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Nav />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <a 
            href="/" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200 mb-6"
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#95866A';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#4b5563';
            }}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </a>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <svg className="w-12 h-12 mx-auto text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-lg font-medium text-red-800 mb-2">Event Not Found</h3>
            <p className="text-red-700">{error || 'The requested event could not be found.'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      
      {/* Back Button */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <a 
          href="/" 
          className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200"
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#95866A';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#4b5563';
          }}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </a>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          
          {/* Header */}
          <div className="px-8 py-6 border-b border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg" style={{backgroundColor: 'rgba(149, 134, 106, 0.1)'}}>
                <svg className="w-6 h-6" style={{color: '#95866A'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
                <p className="text-gray-600 mt-1">Event QR Code</p>
              </div>
            </div>
            
            {/* Event Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Start Time</p>
                    <p className="text-gray-900">{new Date(event.start_time).toLocaleString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZoneName: 'short'
                    })}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-700">End Time</p>
                    <p className="text-gray-900">{new Date(event.end_time).toLocaleString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZoneName: 'short'
                    })}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Location</p>
                    <p className="text-gray-900">{event.location}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Attendees</p>
                    <p className="text-gray-900">{event.attendance_count} checked in</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="px-8 py-12 text-center">
            <div className="inline-block p-8 bg-white rounded-xl shadow-lg border-2 border-gray-100">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Check-in QR Code</h2>
                <p className="text-gray-600">Have attendees scan this code to check into the event</p>
              </div>
              
              <div className="flex justify-center mb-6">
                <canvas 
                  ref={canvasRef} 
                  className="rounded-lg shadow-sm"
                  style={{background: 'white'}}
                />
              </div>
              
              <div className="text-sm text-gray-500 max-w-md mx-auto">
                <p className="mb-2">
                  <strong>Check-in URL:</strong>
                </p>
                <p className="font-mono text-xs bg-gray-50 p-2 rounded border break-all">
                  {`${location.origin}/checkin?token=${event.checkin_token}`}
                </p>
              </div>
            </div>
          </div>

          {/* Notes Section (if exists) */}
          {event.notes && (
            <div className="px-8 py-6 bg-gray-50 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Event Notes</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{event.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}