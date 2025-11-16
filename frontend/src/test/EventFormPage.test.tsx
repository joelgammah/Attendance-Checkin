import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { vi } from 'vitest'
import '@testing-library/jest-dom'
import EventFormPage from '../pages/EventFormPage'

// Mock dependencies
vi.mock('../components/Nav', () => ({
  default: () => <div data-testid="nav">Nav Component</div>
}))

vi.mock('../api/events', () => ({
  createEvent: vi.fn()
}))

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: ''
  },
  writable: true
})

// Mock history.pushState so tests can assert navigation
const mockPushState = vi.fn()
Object.defineProperty(window, 'history', {
  value: { pushState: mockPushState },
  writable: true
})

import { createEvent } from '../api/events'
const mockCreateEvent = createEvent as unknown as ReturnType<typeof vi.fn>

describe('EventFormPage', () => {
  // Force a stable timezone for payload assertions
  let dtfSpy: any

  beforeAll(() => {
    const OriginalDTF = Intl.DateTimeFormat
    dtfSpy = vi.spyOn(Intl, 'DateTimeFormat').mockImplementation((...args: any[]) => {
      const formatter = new (OriginalDTF as any)(...args)
      return {
        ...formatter,
        resolvedOptions: () => ({
          ...(formatter.resolvedOptions ? formatter.resolvedOptions() : {}),
          timeZone: 'America/New_York'
        })
      } as any
    })
  })

  afterAll(() => {
    dtfSpy?.mockRestore()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    window.location.href = ''
  })

  it('renders the form with all required fields', () => {
    render(<EventFormPage />)
    
    expect(screen.getByText('Create New Event')).toBeInTheDocument()
    expect(screen.getByLabelText(/event name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/location/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/start date & time/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/end date & time/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create event/i })).toBeInTheDocument()
  })

  it('renders the back button with correct link', () => {
    render(<EventFormPage />)
    
    const backButton = screen.getByText('Back to Dashboard')
    expect(backButton).toBeInTheDocument()
    expect(backButton.closest('a')).toHaveAttribute('href', '/')
  })

  it('updates form fields when user types', () => {
    render(<EventFormPage />)
    
    const nameInput = screen.getByLabelText(/event name/i) as HTMLInputElement
    const locationInput = screen.getByLabelText(/location/i) as HTMLInputElement
    const notesInput = screen.getByLabelText(/notes/i) as HTMLTextAreaElement
    
    fireEvent.change(nameInput, { target: { value: 'Test Event' } })
    fireEvent.change(locationInput, { target: { value: 'Test Location' } })
    fireEvent.change(notesInput, { target: { value: 'Test notes' } })
    
    expect(nameInput.value).toBe('Test Event')
    expect(locationInput.value).toBe('Test Location')
    expect(notesInput.value).toBe('Test notes')
  })

  it('updates datetime fields correctly', () => {
    render(<EventFormPage />)
    
    const startTimeInput = screen.getByLabelText(/start date & time/i) as HTMLInputElement
    const endTimeInput = screen.getByLabelText(/end date & time/i) as HTMLInputElement
    
    const startTime = '2024-12-01T10:00'
    const endTime = '2024-12-01T12:00'
    
    fireEvent.change(startTimeInput, { target: { value: startTime } })
    fireEvent.change(endTimeInput, { target: { value: endTime } })
    
    expect(startTimeInput.value).toBe(startTime)
    expect(endTimeInput.value).toBe(endTime)
  })

  it('submits form with valid data successfully', async () => {
    const mockEvent = { id: 1, checkin_token: 'test-token-123' }
    mockCreateEvent.mockResolvedValue(mockEvent)
    
    render(<EventFormPage />)
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText(/event name/i), { 
      target: { value: 'Test Event' } 
    })
    fireEvent.change(screen.getByLabelText(/location/i), { 
      target: { value: 'Test Location' } 
    })
    fireEvent.change(screen.getByLabelText(/start date & time/i), { 
      target: { value: '2024-12-01T10:00' } 
    })
    fireEvent.change(screen.getByLabelText(/end date & time/i), { 
      target: { value: '2024-12-01T12:00' } 
    })
    fireEvent.change(screen.getByLabelText(/notes/i), { 
      target: { value: 'Test notes' } 
    })
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /create event/i })
    fireEvent.click(submitButton)
    
    // Check loading state
    expect(screen.getByText('Creating Event...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
    
    await waitFor(() => {
      expect(mockCreateEvent).toHaveBeenCalledWith({
        name: 'Test Event',
        location: 'Test Location',
        start_time: '2024-12-01T10:00',
        end_time: '2024-12-01T12:00',
        notes: 'Test notes',
        timezone: 'America/New_York',
        end_date: '',
        recurring: false,
        weekdays: []
      })
    })
    
    await waitFor(() => {
      expect(mockPushState).toHaveBeenCalledWith({}, '', '/events/test-token-123')
    })
  })

  it('prevents form submission and shows validation for empty required fields', async () => {
    render(<EventFormPage />)
    
    const submitButton = screen.getByRole('button', { name: /create event/i })
    fireEvent.click(submitButton)
    
    // HTML5 validation should prevent submission
    expect(mockCreateEvent).not.toHaveBeenCalled()
  })

  it('handles API error during form submission', async () => {
    const errorMessage = 'Failed to create event'
    mockCreateEvent.mockRejectedValue(new Error(errorMessage))
    
    render(<EventFormPage />)
    
    // Fill out required fields
    fireEvent.change(screen.getByLabelText(/event name/i), { 
      target: { value: 'Test Event' } 
    })
    fireEvent.change(screen.getByLabelText(/location/i), { 
      target: { value: 'Test Location' } 
    })
    fireEvent.change(screen.getByLabelText(/start date & time/i), { 
      target: { value: '2024-12-01T10:00' } 
    })
    fireEvent.change(screen.getByLabelText(/end date & time/i), { 
      target: { value: '2024-12-01T12:00' } 
    })
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create event/i }))
    
    await waitFor(() => {
      expect(screen.getByText('Error creating event')).toBeInTheDocument()
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
    
    // Should not redirect on error
    expect(window.location.href).toBe('')
    
    // Loading state should be cleared
    expect(screen.getByRole('button', { name: /create event/i })).not.toBeDisabled()
  })

  it('handles form submission without optional notes field', async () => {
    const mockEvent = { id: 1, checkin_token: 'test-token-456' }
    mockCreateEvent.mockResolvedValue(mockEvent)
    
    render(<EventFormPage />)
    
    // Fill out only required fields
    fireEvent.change(screen.getByLabelText(/event name/i), { 
      target: { value: 'Test Event' } 
    })
    fireEvent.change(screen.getByLabelText(/location/i), { 
      target: { value: 'Test Location' } 
    })
    fireEvent.change(screen.getByLabelText(/start date & time/i), { 
      target: { value: '2024-12-01T10:00' } 
    })
    fireEvent.change(screen.getByLabelText(/end date & time/i), { 
      target: { value: '2024-12-01T12:00' } 
    })
    
    fireEvent.click(screen.getByRole('button', { name: /create event/i }))
    
    await waitFor(() => {
      expect(mockCreateEvent).toHaveBeenCalledWith({
        name: 'Test Event',
        location: 'Test Location',
        start_time: '2024-12-01T10:00',
        end_time: '2024-12-01T12:00',
        notes: '',
        timezone: 'America/New_York',
        end_date: '',
        recurring: false,
        weekdays: []
      })
    })
  })

  it('shows loading spinner and disables button during submission', async () => {
    // Make the API call hang to test loading state
    mockCreateEvent.mockImplementation(() => new Promise(() => {}))
    
    render(<EventFormPage />)
    
    // Fill out required fields
    fireEvent.change(screen.getByLabelText(/event name/i), { 
      target: { value: 'Test Event' } 
    })
    fireEvent.change(screen.getByLabelText(/location/i), { 
      target: { value: 'Test Location' } 
    })
    fireEvent.change(screen.getByLabelText(/start date & time/i), { 
      target: { value: '2024-12-01T10:00' } 
    })
    fireEvent.change(screen.getByLabelText(/end date & time/i), { 
      target: { value: '2024-12-01T12:00' } 
    })
    
    fireEvent.click(screen.getByRole('button', { name: /create event/i }))
    
    expect(screen.getByText('Creating Event...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /creating event/i })).toBeDisabled()
    
    // Should see loading spinner
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('clears error when form is resubmitted', async () => {
    // First submission fails
    mockCreateEvent.mockRejectedValueOnce(new Error('Network error'))
    
    render(<EventFormPage />)
    
    // Fill and submit form
    fireEvent.change(screen.getByLabelText(/event name/i), { 
      target: { value: 'Test Event' } 
    })
    fireEvent.change(screen.getByLabelText(/location/i), { 
      target: { value: 'Test Location' } 
    })
    fireEvent.change(screen.getByLabelText(/start date & time/i), { 
      target: { value: '2024-12-01T10:00' } 
    })
    fireEvent.change(screen.getByLabelText(/end date & time/i), { 
      target: { value: '2024-12-01T12:00' } 
    })
    
    fireEvent.click(screen.getByRole('button', { name: /create event/i }))
    
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
    
    // Second submission succeeds
    mockCreateEvent.mockResolvedValueOnce({ id: 1, checkin_token: 'success-token' })
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /create event/i }))
    })
    
    // Error should be cleared during submission
    expect(screen.queryByText('Network error')).not.toBeInTheDocument()
  })

  it('handles focus and blur events on form inputs', () => {
    render(<EventFormPage />)
    
    const nameInput = screen.getByLabelText(/event name/i)
    
    // Test focus styling
    fireEvent.focus(nameInput)
    expect(nameInput.style.borderColor).toBe('rgb(149, 134, 106)')
    
    // Test blur styling
    fireEvent.blur(nameInput)
    expect(nameInput.style.borderColor).toBe('rgb(209, 213, 219)')
  })

  it('handles mouse hover events on buttons and links', () => {
    render(<EventFormPage />)
    
    const backButton = screen.getByText('Back to Dashboard')
    const submitButton = screen.getByRole('button', { name: /create event/i })
    
    // Test back button hover
    fireEvent.mouseEnter(backButton)
    expect(backButton.style.color).toBe('rgb(149, 134, 106)')
    
    fireEvent.mouseLeave(backButton)
    expect(backButton.style.color).toBe('rgb(107, 114, 128)')
    
    // Test submit button hover (when not loading)
    fireEvent.mouseEnter(submitButton)
    expect(submitButton.style.backgroundColor).toBe('rgb(125, 111, 87)')
    
    fireEvent.mouseLeave(submitButton)
    expect(submitButton.style.backgroundColor).toBe('rgb(149, 134, 106)')
  })
})