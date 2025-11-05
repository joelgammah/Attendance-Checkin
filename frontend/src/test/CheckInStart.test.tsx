import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import '@testing-library/jest-dom'

// Mock localStorage
const mockLocalStorage = {
  removeItem: vi.fn(),
  getItem: vi.fn(),
  setItem: vi.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: ''
  },
  writable: true
})

import CheckInStart from '../pages/CheckInStart'

describe('CheckInStart Enhanced Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.location.href = ''
  })

  // Navigation Bar Tests
  it('renders navigation bar with brand and buttons', () => {
    render(<CheckInStart />)
    
    expect(screen.getByText('Terrier Check-In')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Logout')).toBeInTheDocument()
  })

  it('handles dashboard button click', () => {
    render(<CheckInStart />)
    
    const dashboardButton = screen.getByText('Dashboard')
    fireEvent.click(dashboardButton)
    
    expect(window.location.href).toBe('/attendee')
  })

  it('handles logout button click', () => {
    render(<CheckInStart />)
    
    const logoutButton = screen.getByText('Logout')
    fireEvent.click(logoutButton)
    
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token')
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('roles')
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('primary_role')
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('active_role')
    expect(window.location.href).toBe('/login')
  })

  it('handles dashboard button hover effects', () => {
    render(<CheckInStart />)
    
    const dashboardButton = screen.getByText('Dashboard').closest('button')!
    
    // Test hover enter
    fireEvent.mouseEnter(dashboardButton)
    expect(dashboardButton.style.backgroundColor).toBe('rgba(149, 134, 106, 0.1)')
    
    // Test hover leave
    fireEvent.mouseLeave(dashboardButton)
    expect(dashboardButton.style.backgroundColor).toBe('transparent')
  })

  it('handles logout button hover effects', () => {
    render(<CheckInStart />)
    
    const logoutButton = screen.getByText('Logout').closest('button')!
    
    // Test hover enter
    fireEvent.mouseEnter(logoutButton)
    expect(logoutButton.style.backgroundColor).toBe('rgb(125, 111, 87)')
    
    // Test hover leave
    fireEvent.mouseLeave(logoutButton)
    expect(logoutButton.style.backgroundColor).toBe('rgb(149, 134, 106)')
  })

  // Header Section Tests
  it('renders header section with correct content', () => {
    render(<CheckInStart />)
    
    expect(screen.getByText('Event Check-In')).toBeInTheDocument()
    expect(screen.getByText('Enter your event token or scan the QR code to begin.')).toBeInTheDocument()
  })

  // Form Tests
  it('renders form with correct labels and placeholders', () => {
    render(<CheckInStart />)
    
    expect(screen.getByText('Event Token')).toBeInTheDocument()
    
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('placeholder', 'Enter event token (e.g., a1Bcd234E-5Fg6789HI-Jk012)')
    expect(input).toHaveAttribute('required')
    
    expect(screen.getByText('Clear')).toBeInTheDocument()
    expect(screen.getByText('Check In')).toBeInTheDocument()
  })

  it('updates input value when user types', () => {
    render(<CheckInStart />)
    
    const input = screen.getByRole('textbox') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'test-token-123' } })
    
    expect(input.value).toBe('test-token-123')
  })

  it('shows error when submitting empty token', () => {
    render(<CheckInStart />)
    
    const form = document.querySelector('form')!
    const input = screen.getByRole('textbox')
    
    // Remove the required attribute to bypass HTML5 validation for testing
    input.removeAttribute('required')
    fireEvent.submit(form)
    
    expect(screen.getByText('Please enter an event token')).toBeInTheDocument()
  })

  it('shows error when submitting whitespace-only token', () => {
    render(<CheckInStart />)
    
    const form = document.querySelector('form')!
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '   ' } })
    
    fireEvent.submit(form)
    
    expect(screen.getByText('Please enter an event token')).toBeInTheDocument()
  })

  it('navigates with simple token', () => {
    render(<CheckInStart />)
    
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'simple-token' } })
    
    const submitButton = screen.getByText('Check In')
    fireEvent.click(submitButton)
    
    expect(window.location.href).toBe('/checkin/simple-token')
  })

  it('extracts token from HTTP URL', () => {
    render(<CheckInStart />)
    
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'http://example.com/checkin?token=extracted-token' } })
    
    const submitButton = screen.getByText('Check In')
    fireEvent.click(submitButton)
    
    expect(window.location.href).toBe('/checkin/extracted-token')
  })

  it('extracts token from HTTPS URL', () => {
    render(<CheckInStart />)
    
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'https://example.com/event?token=https-token&other=param' } })
    
    const submitButton = screen.getByText('Check In')
    fireEvent.click(submitButton)
    
    expect(window.location.href).toBe('/checkin/https-token')
  })

  it('shows error when URL has no token parameter', () => {
    render(<CheckInStart />)
    
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'https://example.com/checkin?other=param' } })
    
    const submitButton = screen.getByText('Check In')
    fireEvent.click(submitButton)
    
    expect(screen.getByText('No token found in the URL')).toBeInTheDocument()
  })

  it('shows error for invalid URL', () => {
    render(<CheckInStart />)
    
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'http://invalid url with spaces' } })
    
    const submitButton = screen.getByText('Check In')
    fireEvent.click(submitButton)
    
    expect(screen.getByText('Invalid URL: http://invalid url with spaces')).toBeInTheDocument()
  })

  it('clears input and error when clear button is clicked', () => {
    render(<CheckInStart />)
    
    const form = document.querySelector('form')!
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'test-token' } })
    
    // First trigger an error
    fireEvent.change(input, { target: { value: '   ' } })
    fireEvent.submit(form)
    expect(screen.getByText('Please enter an event token')).toBeInTheDocument()
    
    // Now clear
    const clearButton = screen.getByText('Clear')
    fireEvent.click(clearButton)
    
    expect((input as HTMLInputElement).value).toBe('')
    expect(screen.queryByText('Please enter an event token')).not.toBeInTheDocument()
  })

  it('encodes special characters in token for URL', () => {
    render(<CheckInStart />)
    
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'token with spaces & symbols' } })
    
    const submitButton = screen.getByText('Check In')
    fireEvent.click(submitButton)
    
    expect(window.location.href).toBe('/checkin/token%20with%20spaces%20%26%20symbols')
  })

  it('clears error when user starts typing after error', () => {
    render(<CheckInStart />)
    
    const form = document.querySelector('form')!
    const input = screen.getByRole('textbox')
    
    // Remove required attribute and trigger an error
    input.removeAttribute('required')
    fireEvent.submit(form)
    expect(screen.getByText('Please enter an event token')).toBeInTheDocument()
    
    // Then type something and submit again (this should clear the error)
    fireEvent.change(input, { target: { value: 'new-token' } })
    fireEvent.submit(form)
    
    // Error should be cleared and navigation should happen
    expect(screen.queryByText('Please enter an event token')).not.toBeInTheDocument()
    expect(window.location.href).toBe('/checkin/new-token')
  })

  it('handles submit button hover effects', () => {
    render(<CheckInStart />)
    
    const submitButton = screen.getByText('Check In')
    
    // Test initial style
    expect(submitButton.style.backgroundColor).toBe('rgb(149, 134, 106)')
    
    // Test hover leave
    fireEvent.mouseLeave(submitButton)
    expect(submitButton.style.backgroundColor).toBe('rgb(149, 134, 106)')
  })

  it('handles form submission via form submit event', () => {
    render(<CheckInStart />)
    
    const form = document.querySelector('form')!
    const input = screen.getByRole('textbox')
    
    fireEvent.change(input, { target: { value: 'form-submit-token' } })
    fireEvent.submit(form)
    
    expect(window.location.href).toBe('/checkin/form-submit-token')
  })

  it('trims whitespace from token before processing', () => {
    render(<CheckInStart />)
    
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '  trimmed-token  ' } })
    
    const submitButton = screen.getByText('Check In')
    fireEvent.click(submitButton)
    
    expect(window.location.href).toBe('/checkin/trimmed-token')
  })

  it('handles URL with token at different positions in query string', () => {
    render(<CheckInStart />)
    
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'https://example.com/path?first=value&token=middle-token&last=value' } })
    
    const submitButton = screen.getByText('Check In')
    fireEvent.click(submitButton)
    
    expect(window.location.href).toBe('/checkin/middle-token')
  })

  it('renders all SVG icons without errors', () => {
    render(<CheckInStart />)
    
    // Check that SVG elements are present
    const svgElements = document.querySelectorAll('svg')
    expect(svgElements.length).toBeGreaterThan(0)
    
    // Verify specific icons are rendered
    expect(document.querySelector('svg[viewBox="0 0 24 24"]')).toBeInTheDocument()
  })

  it('renders divider element in navigation', () => {
    render(<CheckInStart />)
    
    const divider = document.querySelector('.h-6.w-px.bg-gray-300')
    expect(divider).toBeInTheDocument()
  })

  it('renders without crashing', () => {
    const { container } = render(<CheckInStart />)
    expect(container.firstChild).toBeTruthy()
  })

  it('component exists and is defined', () => {
    expect(CheckInStart).toBeDefined()
    expect(typeof CheckInStart).toBe('function')
  })
})