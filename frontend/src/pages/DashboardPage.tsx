// src/pages/DashboardPage.tsx

import React from 'react'
import Nav from '../components/Nav'
import { getDashboardEvents, downloadAttendanceCsv, csvUrl } from '../api/events'
import type { DashboardItem } from '../types'
import { Link } from '../components/Protected'
import EventList from '../components/EventList'

export default function DashboardPage() {
  const [upcoming, setUpcoming] = React.useState<DashboardItem[]>([])
  const [past, setPast] = React.useState<DashboardItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [showNotification, setShowNotification] = React.useState(false)
  const [notificationMessage, setNotificationMessage] = React.useState('')
  const [expandedUpcoming, setExpandedUpcoming] = React.useState(false)
  const [expandedPast, setExpandedPast] = React.useState(false)

  const showSuccessNotification = (message: string) => {
    setNotificationMessage(message)
    setShowNotification(true)
    setTimeout(() => setShowNotification(false), 7000)
  }

  React.useEffect(() => {
    (async () => {
      try {
        const data = await getDashboardEvents()
        setUpcoming(data.upcoming)
        setPast(data.past)
      } catch (err) {
        console.error('Dashboard load failed', err)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const handleCsvClick = React.useCallback(
    (id: number, name: string) => async (e: React.MouseEvent) => {
      e.preventDefault()
      try {
        await downloadAttendanceCsv(id, name)
        showSuccessNotification(`Attendance report for "${name}" downloaded!`)
      } catch (err) {
        showSuccessNotification('CSV export failed. Please try again.')
      }
    },
    []
  )

  if (loading) return null

  const upcomingToDisplay = expandedUpcoming ? upcoming : upcoming.slice(0, 5)
  const pastToDisplay = expandedPast ? past : past.slice(0, 5)

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-xl" style={{ backgroundColor: 'rgba(149, 134, 106, 0.1)' }}>
              <svg className="w-8 h-8" style={{ color: '#95866A' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Main */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-8">

          {/* Upcoming */}
          <section>
            <SectionHeader
              title="Upcoming Events"
              count={upcoming.length}
              expanded={expandedUpcoming}
              onToggle={() => setExpandedUpcoming(!expandedUpcoming)}
            />
            <EventList items={upcomingToDisplay} showCsv onCsv={handleCsvClick} />
          </section>

          {/* Past */}
          <section>
            <SectionHeader
              title="Past Events"
              count={past.length}
              expanded={expandedPast}
              onToggle={() => setExpandedPast(!expandedPast)}
            />
            <EventList items={pastToDisplay} showCsv onCsv={handleCsvClick} />
          </section>
        </div>
      </div>

      {/* Toast */}
      {showNotification && (
        <div className="fixed bottom-4 right-4 z-50">
          <Toast message={notificationMessage} onClose={() => setShowNotification(false)} />
        </div>
      )}
    </div>
  )
}

function SectionHeader({ title, count, expanded, onToggle }: { title: string; count: number; expanded: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg" style={{ backgroundColor: 'rgba(149, 134, 106, 0.1)' }}>
          <svg className="w-5 h-5" style={{ color: '#95866A' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      </div>

      <div className="flex items-center space-x-3">
        <span className="px-3 py-1 text-sm font-medium rounded-full" style={{ backgroundColor: 'rgba(149, 134, 106, 0.1)', color: '#95866A' }}>
          {count} events
        </span>

        {count > 5 && (
          <button
            onClick={onToggle}
            className="px-3 py-1 text-sm font-medium rounded-full transition-all duration-200 hover:opacity-80"
            style={{ backgroundColor: 'rgba(149, 134, 106, 0.1)', color: '#95866A' }}
          >
            {expanded ? 'View Less' : 'View All'}
          </button>
        )}
      </div>
    </div>
  )
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 flex items-center space-x-3 max-w-sm">
      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{message}</p>
      </div>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors duration-200">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
