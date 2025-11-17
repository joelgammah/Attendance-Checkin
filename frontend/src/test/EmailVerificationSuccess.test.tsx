import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import '@testing-library/jest-dom'
import EmailVerificationSuccess from '../pages/EmailVerificationSuccess'

describe('EmailVerificationSuccess', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('renders heading, copy and continue button', () => {
    render(<EmailVerificationSuccess />)

    expect(screen.getByText('Email Verified')).toBeInTheDocument()
    expect(screen.getByText(/@wofford.edu/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue to login/i })).toBeInTheDocument()
  })

  it('navigates to /login when Continue to Login is clicked', () => {
    const pushSpy = vi.spyOn(window.history as any, 'pushState')
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')

    render(<EmailVerificationSuccess />)

    fireEvent.click(screen.getByRole('button', { name: /continue to login/i }))

    expect(pushSpy).toHaveBeenCalled()
    // Ensure the final argument (url) is /login
    const calls = (pushSpy as any).mock.calls
    expect(calls[calls.length - 1][2]).toBe('/login')
    expect(dispatchSpy).toHaveBeenCalled()
  })
})
