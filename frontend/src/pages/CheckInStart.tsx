import React, { useState } from 'react'

export default function CheckInStart(){
    const [token, setToken] = useState('')
    const [error, setError] = useState('')

    function submit(e: React.FormEvent){
        e.preventDefault()
        setError('')
        let t = token.trim()
        if (!t) { 
            setError('Please enter an event token or URL'); 
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
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="w-full max-w-lg p-8 bg-white rounded-2xl shadow">
                <h1 className="text-2xl font-bold mb-2">Event Check-In</h1>
                <p className="text-sm text-gray-600 mb-6">Enter the event token you received to begin check-in.</p>

                <form onSubmit={submit} className="space-y-4">
                    {error && (
                        <div className="text-sm text-red-700 bg-red-50 border border-red-100 p-3 rounded">{error}</div>
                    )}

                    <label className="block">
                        <span className="text-sm font-medium text-gray-700">Event URL</span>
                        <input
                            value={token}
                            onChange={e => setToken(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
                            placeholder="abc123..."
                            required
                        />
                    </label>

                    <div className="grid grid-cols-1 gap-3">
                        <button
                            type="submit"
                            className="w-full inline-flex items-center justify-center px-4 py-2 bg-amber-700 text-white rounded-md hover:bg-amber-600 active:scale-[0.98]"
                        >
                            Continue to Check-In
                        </button>
                        <button
                            type="button"
                            onClick={() => { setToken(''); setError('') }}
                            className="w-full inline-flex items-center justify-center px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-50"
                        >
                            Clear
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}