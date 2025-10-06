import React from 'react'
import { login } from '../api/auth'

export default function LoginPage(){
  const [email, setEmail] = React.useState('grayj@wofford.edu')
  const [password, setPassword] = React.useState('grayj')
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0)

  // Array of images to cycle through
  const images = [
    '/images/ui/login-1.jpg',
    '/images/ui/login-2.jpg',
    '/images/ui/login-3.jpg',
    '/images/ui/login-4.jpg',
    '/images/ui/login-5.jpg',
    '/images/ui/login-6.jpg',
  ]

  // Change image every 7 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        (prevIndex + 1) % images.length
      )
    }, 7000) // 7 seconds

    return () => clearInterval(interval) // Cleanup on unmount
  }, [images.length])

  async function onSubmit(e: React.FormEvent){
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try{ 
      const loginData = await login(email, password)

      // Store email for later use
      localStorage.setItem('user_email', email)
      
      // Role-based routing
      if (loginData.role === 'attendee') {
        location.href = '/'  // Attendees go to their dashboard
      } else if (loginData.role === 'organizer' || loginData.role === 'admin') {
        location.href = '/'  // Organizers/admins go to main dashboard
      } else {
        location.href = '/'  // Default fallback
      }
    } catch(err: any) {
      let errorMessage = 'Login failed'

      try {
        // Try to parse the JSON string in err.message
        const errorData = JSON.parse(err.message)
        errorMessage = errorData.detail || errorMessage
      } catch {
        // If parsing fails, just use the error.message or fallback
        errorMessage = err.message || errorMessage  
      }
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md p-8 rounded-2xl border border-gray-200 shadow-lg bg-white">
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6" style={{backgroundColor: '#95866A'}}>
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Welcome back</h1>
            <p className="text-lg text-gray-600">Sign in to access Terrier Check-In</p>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Error Alert */}
            {error && (
              <div className="rounded-lg p-4 flex items-start space-x-3" 
                  style={{
                    backgroundColor: 'rgba(149, 134, 106, 0.1)',
                    borderColor: 'rgba(149, 134, 106, 0.3)',
                    borderWidth: '1px'
                  }} 
                  role="alert">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" 
                    style={{color: '#95866A'}} 
                    fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium" style={{color: '#6b5a47'}}>Authentication failed</h3>
                  <p className="text-sm mt-1" style={{color: '#7d6f57'}}>{error}</p>
                </div>
              </div>
            )}

            {/* Email Input */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg transition-colors duration-200"
                style={{
                  '--tw-ring-color': '#95866A',
                } as any}
                onFocus={(e) => {
                  e.target.style.borderColor = '#95866A';
                  e.target.style.boxShadow = `0 0 0 2px rgba(149, 134, 106, 0.2)`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
                placeholder="Enter your email"
                required
              />
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg transition-colors duration-200"
                onFocus={(e) => {
                  e.target.style.borderColor = '#95866A';
                  e.target.style.boxShadow = `0 0 0 2px rgba(149, 134, 106, 0.2)`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
                placeholder="Enter your password"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all duration-200 ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'active:scale-[0.98]'
              }`}
              style={loading ? {} : {
                backgroundColor: '#95866A'
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = '#7d6f57';
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = '#95866A';
              }}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign in'
              )}
            </button>

            {/* Helper Text */}
            <div className="rounded-lg p-4" style={{backgroundColor: 'rgba(149, 134, 106, 0.1)', borderColor: 'rgba(149, 134, 106, 0.3)', borderWidth: '1px'}}>
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" style={{color: '#95866A'}} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium" style={{color: '#6b5a47'}}>Development tip</h3>
                  <p className="text-sm mt-1" style={{color: '#7d6f57'}}>Password is the username part (before @)</p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Right Side - Image Carousel */}
      <div className="hidden lg:block flex-1 p-0 pr-4 pb-4 pt-4 lg:pr-6 lg:pb-6 lg:pt-6 xl:pr-8 xl:pb-8 xl:pt-8">
        {/* Rounded Corners with Overflow Hidden */}
        <div className="h-full relative rounded-tr-3xl rounded-bl-3xl overflow-hidden" style={{borderTopLeftRadius: '8rem', borderBottomRightRadius: '8rem'}}>
          {images.map((imageSrc, index) => (
            <img 
              key={index}
              src={imageSrc} 
              alt={`Terrier Check-In ${index + 1}`}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                index === currentImageIndex ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ))}
          
          {/* Overlay */}
          <div className="absolute inset-0" style={{backgroundColor: 'rgba(149, 134, 106, 0.2)'}}></div>
          
          {/* Content */}
          <div className="relative h-full flex items-center justify-center p-12">
            <div className="text-center text-white">
              <h2 className="text-4xl font-bold mb-4">Terrier Check-In</h2>
              <p className="text-xl mb-8 opacity-90">
                Experience seamless event check-ins.
              </p>
              <div className="flex items-center justify-center space-x-4 text-sm opacity-75">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Fast & Secure</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Easy to Use</span>
                </div>
              </div>
              
              {/* Image Indicator Dots */}
              <div className="flex justify-center space-x-2 mt-8">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentImageIndex 
                        ? 'bg-white scale-125' 
                        : 'bg-white/50 hover:bg-white/75'
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}