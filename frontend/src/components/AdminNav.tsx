import { logout, getUserRole } from '../api/auth';
import { Link } from './Protected';
import RoleSwitch from './RoleSwitch';
import { useAuth0 } from '@auth0/auth0-react';

export default function AdminNav({ onAddUser }: { onAddUser?: () => void } = {}) {
  const role = getUserRole();
  const { isAuthenticated, logout: auth0Logout } = useAuth0();

  return (
    <nav className="w-full flex items-center justify-between p-6 bg-white border-b border-gray-200 shadow-sm">
      {/* Brand/Logo */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg" style={{ backgroundColor: '#95866A' }}>
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Terrier Check-In</h1>
        </div>
      </div>

      {/* Navigation Links */}
  <div className="flex items-center space-x-4">
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

        {/* Add User Button */}
        <button
          type="button"
          className="px-4 py-2 text-sm font-medium text-gray-700 rounded-lg transition-colors duration-200 cursor-pointer"
          onClick={onAddUser}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = 'rgba(149, 134, 106, 0.1)';
            e.currentTarget.style.color = '#95866A';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#374151';
          }}
        >
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add User</span>
          </div>
        </button>

        {/* Profile Icon */}
        {/* <div className="w-10 h-10 rounded-full bg-[#95866A] flex items-center justify-center border-2 border-gray-600">
          <svg className="w-7 h-7 text-gray-100" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 8-4 8-4s8 0 8 4" />
          </svg>
        </div> */}

        {/* Divider */}
        <div className="h-6 w-px bg-gray-300 mx-2"></div>
        
        {/* Logout Button */}
        <button
          onClick={() => { 
            // If Auth0 user, clear ALL localStorage before Auth0 logout
            if (isAuthenticated) {
              // Clear ALL localStorage (including our custom keys AND Auth0's cache)
              // This prevents any stale data from being restored after Auth0 redirect
              localStorage.clear()
              
              // Now call Auth0 logout which will redirect through Auth0
              auth0Logout({
                logoutParams: {
                  returnTo: window.location.origin
                }
              })
            } else {
              // Demo account - clear localStorage and navigate to login
              logout()
              history.pushState({}, '', '/login')
              window.dispatchEvent(new PopStateEvent('popstate'))
            }
          }}
          className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-all duration-200 active:scale-95"
          style={{ backgroundColor: '#95866A' }}
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
  );
}
