// src/components/SoloEventCard.tsx

import { Link } from './Protected'
import type { EventOut } from '../types'
import { csvUrl } from '../api/events'

export default function SoloEventCard({
  event,
  showCsv = false,
  onCsv
}: {
  event: EventOut
  showCsv?: boolean
  onCsv?: (id: number, name: string) => (e: React.MouseEvent) => void
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        
        {/* Left side */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 pr-4 flex items-center gap-2">
              {event.name}
              {event.recurring && (
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold"
                  style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: '#059669', marginLeft: 4 }}
                >
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
                  history.pushState({}, '', `/events/${event.id}/attendees`)
                  window.dispatchEvent(new PopStateEvent('popstate'))
                }}
                className="px-2 py-1 rounded-full text-xs font-medium cursor-pointer transition-all duration-200 hover:shadow-sm"
                style={{ backgroundColor: 'rgba(149, 134, 106, 0.1)', color: '#95866A' }}
              >
                {event.attendance_count} attendees
              </button>
            </div>
          </div>

          {/* Date + location */}
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>
                {new Date(event.start_time).toLocaleString()} –{' '}
                {new Date(event.end_time).toLocaleString()}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{event.location}</span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center space-x-3 ml-4">

          {/* QR Button */}
          {new Date() <= new Date(event.end_time) ? (
            <Link
              to={`/events/${event.checkin_token}`}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 border border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-900"
            >
              Show QR
            </Link>
          ) : (
            <span className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-500 border border-gray-200">
              Check-in ended
            </span>
          )}

          {/* CSV */}
          {showCsv && (
            <a
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-lg transition-all duration-200"
              style={{ backgroundColor: '#95866A' }}
              href={csvUrl(event.id)}
              onClick={e => onCsv && onCsv(event.id, event.name)(e)}
            >
              Export CSV
            </a>
          )}

        </div>
      </div>
    </div>
  )
}
