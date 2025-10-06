import React from 'react'
import Nav from '../components/Nav'
import { createEvent } from '../api/events'

export default function EventFormPage(){
  const [form, setForm] = React.useState({ name: '', location: '', start_time: '', end_time: '', notes: '' })
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  function update<K extends keyof typeof form>(k: K, v: string){ setForm(s=>({ ...s, [k]: v })) }

  async function onSubmit(e: React.FormEvent){
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      // Simply convert the datetime-local values to ISO strings
      // The backend will handle timezone conversion properly
      const payload = { 
        ...form, 
        start_time: new Date(form.start_time).toISOString(), 
        end_time: new Date(form.end_time).toISOString() 
      }
      const ev = await createEvent(payload)
      location.href = `/events/${ev.checkin_token}`
    } catch(err:any){ 
      setError(err.message) 
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      
      {/* Back Button */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <a 
          href="/" 
          className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200 mb-6"
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#95866A';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#6b7280';
          }}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </a>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg" style={{backgroundColor: 'rgba(149, 134, 106, 0.1)'}}>
                <svg className="w-6 h-6" style={{color: '#95866A'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Create New Event</h1>
            </div>
            <p className="text-gray-600">Fill in the details below to create your event and generate a QR code for check-ins.</p>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Error Alert */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3" role="alert">
                <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-red-800">Error creating event</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Event Name */}
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Event Name *
              </label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={e=>update('name', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors duration-200"
                style={{'--tw-ring-color': '#95866A'} as any}
                onFocus={(e) => {
                  e.target.style.borderColor = '#95866A';
                  e.target.style.boxShadow = `0 0 0 2px rgba(149, 134, 106, 0.2)`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
                placeholder="Enter event name"
                required
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Location *
              </label>
              <input
                id="location"
                type="text"
                value={form.location}
                onChange={e=>update('location', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors duration-200"
                onFocus={(e) => {
                  e.target.style.borderColor = '#95866A';
                  e.target.style.boxShadow = `0 0 0 2px rgba(149, 134, 106, 0.2)`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
                placeholder="Enter event location"
                required
              />
            </div>

            {/* Date & Time Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Start Time */}
              <div className="space-y-2">
                <label htmlFor="start_time" className="block text-sm font-medium text-gray-700">
                  Start Date & Time *
                </label>
                <input
                  id="start_time"
                  type="datetime-local"
                  value={form.start_time}
                  onChange={e=>update('start_time', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors duration-200"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#95866A';
                    e.target.style.boxShadow = `0 0 0 2px rgba(149, 134, 106, 0.2)`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                  required
                />
              </div>

              {/* End Time */}
              <div className="space-y-2">
                <label htmlFor="end_time" className="block text-sm font-medium text-gray-700">
                  End Date & Time *
                </label>
                <input
                  id="end_time"
                  type="datetime-local"
                  value={form.end_time}
                  onChange={e=>update('end_time', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors duration-200"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#95866A';
                    e.target.style.boxShadow = `0 0 0 2px rgba(149, 134, 106, 0.2)`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                  required
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                id="notes"
                rows={4}
                value={form.notes}
                onChange={e=>update('notes', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors duration-200 resize-none"
                onFocus={(e) => {
                  e.target.style.borderColor = '#95866A';
                  e.target.style.boxShadow = `0 0 0 2px rgba(149, 134, 106, 0.2)`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
                placeholder="Add any additional information about the event (optional)"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all duration-200 ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'active:scale-[0.98]'
                }`}
                style={loading ? {} : {backgroundColor: '#95866A'}}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.backgroundColor = '#7d6f57';
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.backgroundColor = '#95866A';
                }}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Creating Event...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Create Event</span>
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
