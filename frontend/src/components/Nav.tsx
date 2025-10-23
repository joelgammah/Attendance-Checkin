import { logout, getUserRole } from '../api/auth'
import { Link } from './Protected'
import RoleSwitch from './RoleSwitch'

export default function Nav(){
  const role = getUserRole()
  const canCreateEvents = role === 'organizer' || role === 'admin'

  return (
    <nav className="w-full flex items-center justify-between p-6 bg-white border-b border-gray-200 shadow-sm">
      {/* Brand/Logo */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg" style={{backgroundColor: '#95866A'}}>
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Terrier Check-In</h1>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex items-center space-x-1">
        {/* Role Switcher */}
        <div className="mr-4">
          <RoleSwitch />
        </div>
        <Link 
          to="/" 
          className="px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:text-gray-900 transition-colors duration-200"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(149, 134, 106, 0.1)';
            e.currentTarget.style.color = '#95866A';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#374151';
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

        {canCreateEvents && (
          <Link 
            to="/events/new" 
            className="px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:text-gray-900 transition-colors duration-200"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(149, 134, 106, 0.1)';
              e.currentTarget.style.color = '#95866A';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#374151';
            }}
          >
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Create Event</span>
            </div>
          </Link>
        )}

        {/* Divider */}
        <div className="h-6 w-px bg-gray-300 mx-2"></div>

        {/* Logout Button */}
        <button 
          onClick={() => { logout(); location.href = '/login' }} 
          className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-all duration-200 active:scale-95"
          style={{backgroundColor: '#95866A'}}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#7d6f57';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#95866A';
          }}
        >
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </div>
        </button>
      </div>
    </nav>
  )
}