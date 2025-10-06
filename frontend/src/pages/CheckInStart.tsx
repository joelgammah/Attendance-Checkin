import React, { useState } from 'react'

export default function CheckInStart() {
  const [token, setToken] = useState('')
  const [error, setError] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    let t = token.trim()
    if (!t) {
      setError('Please enter an event token or URL')
      return
    }

    try {
      // If user pasted a full URL, extract the token query param
      if (t.startsWith('http://') || t.startsWith('https://')) {
        const url = new URL(t)
        const param = url.searchParams.get('token')
        if (!param) {
          setError('No token found in the URL')
          return
        }
        t = param
      }
    } catch (err) {
      setError('Invalid URL')
      return
    }

    // Navigate to /checkin with token as query param
    window.location.href = `/checkin?token=${encodeURIComponent(t)}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ✅ Nav Bar (consistent with AttendeeDashboard) */}
      <nav className="w-full flex items-center justify-between p-6 bg-white border-b border-gray-200 shadow-sm">
        {/* Brand/Logo */}
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

        {/* Navigation Buttons */}
        <div className="flex items-center space-x-1">
          {/* Dashboard Button */}
          <button
            onClick={() => (window.location.href = '/attendee')}
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
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
              </svg>
              <span>Dashboard</span>
            </div>
          </button>

          {/* Divider */}
          <div className="h-6 w-px bg-gray-300 mx-2"></div>

          {/* Logout Button (same as dashboard) */}
          <button
            onClick={() => {
              localStorage.removeItem('token')
              localStorage.removeItem('role')
              window.location.href = '/login'
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
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
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

      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center space-x-4">
            <div
              className="flex items-center justify-center w-14 h-14 rounded-xl"
              style={{ backgroundColor: 'rgba(149, 134, 106, 0.1)' }}
            >
              <svg
                className="w-7 h-7"
                style={{ color: '#95866A' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Event Check-In</h1>
              <p className="mt-2 text-gray-600">
                Enter your event token or scan the QR code to begin.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
          <form onSubmit={submit} className="space-y-6">
            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-100 p-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event URL or Token
              </label>
              <input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#95866A]"
                placeholder="https://example.com/checkin?token=abc123 or abc123"
                required
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setToken('')
                  setError('')
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200"
              >
                Clear
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-5 py-2 text-sm font-medium text-white rounded-lg transition-all duration-200"
                style={{ backgroundColor: '#95866A' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#7d6f57'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#95866A'
                }}
              >
                Continue to Check-In
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
