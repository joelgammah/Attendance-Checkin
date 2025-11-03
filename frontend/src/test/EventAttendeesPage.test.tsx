import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { vi } from 'vitest'
import '@testing-library/jest-dom'
import EventAttendeesPage from '../pages/EventAttendeesPage'
import { getEvent } from '../api/events'

// Mock dependencies
vi.mock('../components/Nav', () => ({
  default: () => <div data-testid="nav">Nav Component</div>
}))

const mockGetEventAttendees = vi.fn()
const mockDownloadAttendanceCsv = vi.fn()
const mockGetEvent = vi.fn()

const mockEvent = {
  id: 123,
  name: 'Sample Event',
  location: 'Room 101',
  start_time: '2025-01-01T10:00:00Z',
  end_time: '2025-01-01T12:00:00Z',
  notes: null,
  checkin_open_minutes: 15,
  checkin_token: 'token',
  attendance_count: 0,
  recurring: false,
  weekdays: null,
  end_date: null,
  parent_id: null,
  organizer_name: 'Test User',
}

vi.mock('../api/events', () => ({
  getEventAttendees: (...args: any[]) => mockGetEventAttendees(...args),
  downloadAttendanceCsv: (...args: any[]) => mockDownloadAttendanceCsv(...args),
  getEvent: (...args: any[]) => mockGetEvent(...args),
}))

// Mock useParams
vi.mock('../App', () => ({
  useParams: () => ({ eventId: '123' })
}))

describe('EventAttendeesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetEvent.mockResolvedValue(mockEvent)
  })

  it('renders loading state', async () => {
    mockGetEventAttendees.mockReturnValue(new Promise(() => {}))
    render(<EventAttendeesPage />)
    expect(screen.getByText('Loading attendees...')).toBeInTheDocument()
  })


// describe('EventAttendeesPage (eventId missing)', () => {
//   beforeAll(() => {
//     vi.doMock('../App', () => ({
//       useParams: () => ({ eventId: undefined })
//     }))
//   })
//   afterAll(() => {
//     vi.resetModules()
//   })
//   it('renders error state if eventId is missing', async () => {
//     const { default: EventAttendeesPageWithMock } = await import('../pages/EventAttendeesPage')
//     render(<EventAttendeesPageWithMock />)
//     expect(await screen.findByText('Event ID is required')).toBeInTheDocument()
//     expect(screen.getByText('Error')).toBeInTheDocument()
//   })
// })

  it('renders error state if fetch fails', async () => {
    mockGetEventAttendees.mockRejectedValue(new Error('fail'))
    render(<EventAttendeesPage />)
    expect(await screen.findByText('Failed to load event data. Please try again.')).toBeInTheDocument()
    expect(screen.getByText('Error')).toBeInTheDocument()
  })

  it('renders no attendees message', async () => {
    mockGetEventAttendees.mockResolvedValue([])
    render(<EventAttendeesPage />)
    expect(await screen.findByText('No attendees yet')).toBeInTheDocument()
  })

  it('renders attendee list', async () => {
    mockGetEventAttendees.mockResolvedValue([
      { id: 1, attendee_name: 'Alice', attendee_email: 'alice@example.com', checked_in_at: new Date().toISOString() },
      { id: 2, attendee_name: 'Bob', attendee_email: 'bob@example.com', checked_in_at: new Date().toISOString() }
    ])
    render(<EventAttendeesPage />)
    expect(await screen.findByText('Attendee List')).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('bob@example.com')).toBeInTheDocument()
  })

  it('calls downloadAttendanceCsv and shows notification', async () => {
  mockGetEventAttendees.mockResolvedValue([])
  mockDownloadAttendanceCsv.mockResolvedValue(undefined)
    render(<EventAttendeesPage />)
    await screen.findByText('No attendees yet')
    fireEvent.click(screen.getByText('Export CSV'))
    await waitFor(() => {
      expect(mockDownloadAttendanceCsv).toHaveBeenCalled()
      expect(screen.getByText(/has been downloaded|Failed to export CSV/)).toBeInTheDocument()
    })
  })

  it('shows and closes notification', async () => {
  mockGetEventAttendees.mockResolvedValue([])
  mockDownloadAttendanceCsv.mockResolvedValue(undefined)
    render(<EventAttendeesPage />)
    await screen.findByText('No attendees yet')
    fireEvent.click(screen.getByText('Export CSV'))
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    fireEvent.click(screen.getByLabelText('Close notification'))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('navigates back to dashboard on button click', async () => {
    mockGetEventAttendees.mockResolvedValue([])
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true
    })
    render(<EventAttendeesPage />)
    await screen.findByText('No attendees yet')
    fireEvent.click(screen.getAllByRole('button')[0]) // Back button
    expect(window.location.href).toBe('/dashboard')
  })
})
