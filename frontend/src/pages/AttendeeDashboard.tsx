import React from 'react'
import { Link } from '../components/Protected'
import { getMyCheckIns, MyCheckIn } from '../api/attendance'

export default function AttendeeDashboard() {
  const [checkIns, setCheckIns] = React.useState<MyCheckIn[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function loadCheckIns() {
      try {
        const data = await getMyCheckIns()
        setCheckIns(data.slice(0, 5)) // Show last 5 check-ins
      } catch (error) {
        console.error('Failed to load check-ins:', error)
      } finally {
        setLoading(false)
      }
    }
    loadCheckIns()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="w-full flex items-center justify-between p-4 border-b bg-white">
        <div className="font-bold">QR Check-In</div>
        <div className="flex gap-4">
          <Link to="/checkin">Check In</Link>
          <button 
            onClick={() => {
              localStorage.removeItem('token')
              localStorage.removeItem('role')
              location.href = '/login'
            }} 
            className="px-3 py-1 rounded bg-gray-100"
          >
            Logout
          </button>
        </div>
      </nav>
      
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Attendee Dashboard</h1>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Quick Check-In</h2>
            <p className="text-gray-600 mb-4">
              Use this to quickly check into events using a QR code or event token.
            </p>
            <Link 
              to="/checkin" 
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              Start Check-In
            </Link>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Recent Check-ins</h2>
            {loading ? (
              <p className="text-gray-500">Loading...</p>
            ) : checkIns.length > 0 ? (
              <div className="space-y-3">
                {checkIns.map((checkIn) => (
                  <div key={checkIn.id} className="border-l-4 border-green-500 pl-3">
                    <p className="font-medium">{checkIn.event_name}</p>
                    <p className="text-sm text-gray-600">{checkIn.event_location}</p>
                    <p className="text-sm text-gray-500">
                      Checked in: {new Date(checkIn.checked_in_at).toLocaleDateString()} at{' '}
                      {new Date(checkIn.checked_in_at).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                ))}
                {checkIns.length === 5 && (
                  <button className="text-blue-600 text-sm hover:underline">
                    View all check-ins →
                  </button>
                )}
              </div>
            ) : (
              <p className="text-gray-500">No check-ins yet. Start checking into events!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}