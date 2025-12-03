import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import CallbackPage from '../pages/Callback'
import * as auth0 from '@auth0/auth0-react'

vi.mock('@auth0/auth0-react', () => ({
  useAuth0: vi.fn(),
}))

describe('CallbackPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('shows processing UI while loading', () => {
    ;(auth0.useAuth0 as unknown as vi.Mock).mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      error: null,
      user: null,
    })

    render(<CallbackPage />)

    expect(screen.getByText('Processing sign in…')).toBeInTheDocument()
  })

  it('calls history.pushState and dispatches popstate when authenticated', async () => {
    const pushSpy = vi.spyOn(window.history, 'pushState')
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')

    ;(auth0.useAuth0 as unknown as vi.Mock).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      error: null,
      user: { sub: 'auth0|123' },
    })

    render(<CallbackPage />)

    await waitFor(() => {
      expect(pushSpy).toHaveBeenCalledWith({}, '', '/')
      expect(dispatchSpy).toHaveBeenCalled()
      // ensure popstate event was dispatched
      const calledWithPopstate = (dispatchSpy.mock.calls || []).some(
        (args) => args[0] && args[0].type === 'popstate'
      )
      expect(calledWithPopstate).toBe(true)
    })

    pushSpy.mockRestore()
    dispatchSpy.mockRestore()
  })

  it('renders error message when error provided', () => {
    ;(auth0.useAuth0 as unknown as vi.Mock).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      error: { message: 'Oops' },
      user: null,
    })

    render(<CallbackPage />)

    expect(screen.getByText('Error:')).toBeInTheDocument()
    expect(screen.getByText('Oops')).toBeInTheDocument()
  })
})