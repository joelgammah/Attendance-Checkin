import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import '@testing-library/jest-dom'
import EmailVerificationSuccess from '../pages/EmailVerificationSuccess'

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
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
  const calls = (pushSpy as any).mock.calls
  expect(calls[calls.length - 1][2]).toBe('/login')
  expect(dispatchSpy).toHaveBeenCalled()
})

it('navigates to /login and dispatches popstate when button clicked', () => {
  const pushSpy = vi.spyOn(window.history, 'pushState')
  const dispatchSpy = vi.spyOn(window, 'dispatchEvent')

  render(<EmailVerificationSuccess />)

  const btn = screen.getByRole('button', { name: /continue to login/i })
  fireEvent.click(btn)

  expect(pushSpy).toHaveBeenCalledWith({}, '', '/login')

  const dispatched = dispatchSpy.mock.calls.some(
    (call) => call[0] && call[0].type === 'popstate'
  )
  expect(dispatched).toBe(true)
})

it('renders the success icon SVG with expected path', () => {
  const { container } = render(<EmailVerificationSuccess />)
  const path = container.querySelector('svg path')
  expect(path).not.toBeNull()
  expect(path?.getAttribute('d')).toBe('M5 13l4 4L19 7')
})

it('calls history.pushState on each click (multiple clicks)', () => {
  const pushSpy = vi.spyOn(window.history, 'pushState')

  render(<EmailVerificationSuccess />)

  const btn = screen.getByRole('button', { name: /continue to login/i })
  fireEvent.click(btn)
  fireEvent.click(btn)
  fireEvent.click(btn)

  expect(pushSpy).toHaveBeenCalledTimes(3)
})

it('programmatic click (element.click) triggers navigation and dispatch', () => {
  const pushSpy = vi.spyOn(window.history, 'pushState')
  const dispatchSpy = vi.spyOn(window, 'dispatchEvent')

  render(<EmailVerificationSuccess />)

  const btn = screen.getByRole('button', { name: /continue to login/i })
  ;(btn as HTMLButtonElement).click()

  expect(pushSpy).toHaveBeenCalledTimes(1)
  const firstEventArg = dispatchSpy.mock.calls[0]?.[0]
  expect(firstEventArg).toBeDefined()
  expect(firstEventArg.type).toBe('popstate')
})
