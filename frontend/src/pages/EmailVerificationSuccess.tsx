import React from 'react'

export default function EmailVerificationSuccess() {
  const handleLoginRedirect = () => {
    // Navigate to login page
    history.pushState({}, '', '/login')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4" style={{backgroundColor: 'rgba(149, 134, 106, 0.1)'}}>
            <svg 
              className="h-6 w-6" 
              style={{color: '#95866A'}}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5 13l4 4L19 7" 
              />
            </svg>
          </div>

          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Email Verified
          </h2>

          <p className="mt-2 text-sm text-gray-600">
            Your <strong>@wofford.edu</strong> address is confirmed. Continue to the login page to sign in to Terrier Check-In.
          </p>
        </div>
        
        <div className="mt-8 space-y-4">
          <button
            onClick={handleLoginRedirect}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-150 ease-in-out"
            style={{backgroundColor: '#95866A'}}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#7d6f57' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#95866A' }}
          >
            Continue to Login
          </button>
          
          <div className="text-center">
            <p className="text-xs text-gray-500">
              If you're having trouble, please contact support.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}