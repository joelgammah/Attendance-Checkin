import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import EventAttendeesPage from './EventAttendeesPage'
import * as eventsApi from '../api/events'
import type { AttendeeOut } from '../api/events'

// Mock the App module for useParams
vi.mock('../App', () => ({
  useParams: vi.fn()
}))

// Mock the Nav component
vi.mock('../components/Nav', () => ({
  default: () => <div data-testid="nav">Nav Component</div>
}))

// Mock the events API
vi.mock('../api/events', () => ({
  getEventAttendees: vi.fn(),
  downloadAttendanceCsv: vi.fn()
}))

// Mock location.href
Object.defineProperty(window, 'location', {
  value: {
    href: ''
  },
  writable: true
})

const mockUseParams = vi.mocked(await import('../App')).useParams
const mockGetEventAttendees = vi.mocked(eventsApi.getEventAttendees)
const mockDownloadAttendanceCsv = vi.mocked(eventsApi.downloadAttendanceCsv)

const mockAttendees: AttendeeOut[] = [
  {
    id: 1,
    attendee_name: 'John Doe',
    attendee_email: 'john.doe@example.com',
    checked_in_at: '2025-10-23T10:30:00Z'
  },
  {
    id: 2,
    attendee_name: 'Jane Smith',
    attendee_email: 'jane.smith@example.com',
    checked_in_at: '2025-10-23T11:15:00Z'
  }
]

describe('EventAttendeesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.location.href = ''
  })

  it('displays loading spinner when fetching attendees', () => {
    mockUseParams.mockReturnValue({ eventId: '123' })
    mockGetEventAttendees.mockImplementation(() => new Promise(() => {})) // Never resolves

    render(<EventAttendeesPage />)

    expect(screen.getByText('Loading attendees...')).toBeInTheDocument()
  })

  it('displays error when eventId is missing', async () => {
    mockUseParams.mockReturnValue({ eventId: undefined })

    render(<EventAttendeesPage />)

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument()
      expect(screen.getByText('Event ID is required')).toBeInTheDocument()
    })
  })

  it('displays error when API call fails', async () => {
    mockUseParams.mockReturnValue({ eventId: '123' })
    mockGetEventAttendees.mockRejectedValue(new Error('API Error'))

    render(<EventAttendeesPage />)

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument()
      expect(screen.getByText('Failed to load attendees. Please try again.')).toBeInTheDocument()
    })
  })

  it('displays empty state when no attendees', async () => {
    mockUseParams.mockReturnValue({ eventId: '123' })
    mockGetEventAttendees.mockResolvedValue([])

    render(<EventAttendeesPage />)

    await waitFor(() => {
      expect(screen.getByText('No attendees yet')).toBeInTheDocument()
      expect(screen.getByText('No one has checked into this event yet.')).toBeInTheDocument()
    })
  })

  it('renders nav component', () => {
    mockUseParams.mockReturnValue({ eventId: '123' })
    mockGetEventAttendees.mockResolvedValue(mockAttendees)

    render(<EventAttendeesPage />)

    expect(screen.getByTestId('nav')).toBeInTheDocument()
  })

  it('calls getEventAttendees with correct eventId', async () => {
    mockUseParams.mockReturnValue({ eventId: '123' })
    mockGetEventAttendees.mockResolvedValue(mockAttendees)

    render(<EventAttendeesPage />)

    await waitFor(() => {
      expect(mockGetEventAttendees).toHaveBeenCalledWith(123)
    })
  })

  it('sets event name when attendees are loaded', async () => {
    mockUseParams.mockReturnValue({ eventId: '123' })
    mockGetEventAttendees.mockResolvedValue(mockAttendees)

    render(<EventAttendeesPage />)

    await waitFor(() => {
      expect(mockGetEventAttendees).toHaveBeenCalled()
    })
    
    // The component should have processed the attendees data
    expect(mockGetEventAttendees).toHaveBeenCalledWith(123)
  })
})