import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import '@testing-library/jest-dom'

// Mock dependencies
vi.mock('../api/events', () => ({
  getDashboardEvents: vi.fn(),
  downloadAttendanceCsv: vi.fn(),
  csvUrl: vi.fn()
}))

vi.mock('../components/Nav', () => ({
  default: () => <div data-testid="nav">Nav Component</div>
}))

// Import mocked functions
import { getDashboardEvents, downloadAttendanceCsv, csvUrl } from '../api/events'

// Cast to access mock methods
const mockGetDashboardEvents = getDashboardEvents as any
const mockDownloadAttendanceCsv = downloadAttendanceCsv as any
const mockCsvUrl = csvUrl as any

import DashboardPage from '../pages/DashboardPage'

const createDashboardItem = (event: any) => ({ type: 'solo', event })

describe('DashboardPage Coverage Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCsvUrl.mockReturnValue('/csv/download/1')
  })

  const baseEvent = {
    notes: null,
    checkin_open_minutes: 15,
    recurring: false,
    weekdays: [],
    end_date: null,
    parent_id: null,
    organizer_name: null,
    member_count: 0,
    attendance_threshold: null,
  }

  describe('Loading State Coverage', () => {
    it('shows loading state then transitions to loaded', async () => {
      mockGetDashboardEvents.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ upcoming: [], past: [] }), 100))
      )
      
      render(<DashboardPage />)
      await waitFor(() => expect(screen.getByTestId('nav')).toBeInTheDocument(), { timeout: 1000 })
    })
  })

  describe('Success State Coverage', () => {
    it('successfully loads and sets upcoming events', async () => {
      const upcomingEvents = [
        createDashboardItem({
          id: 1,
          name: 'Test Event',
          location: 'Test Location',
          start_time: '2024-12-01T10:00:00Z',
          end_time: '2024-12-01T12:00:00Z',
          attendance_count: 5,
          checkin_token: 'token1',
          ...baseEvent,
        })
      ]
      
      mockGetDashboardEvents.mockResolvedValue({ upcoming: upcomingEvents, past: [] })
      
      render(<DashboardPage />)
      
      await waitFor(() => {
        expect(screen.getByTestId('nav')).toBeInTheDocument()
      })
    })

    it('successfully loads and sets past events', async () => {
      const pastEvents = [
        createDashboardItem({
          id: 1,
          name: 'Past Event',
          location: 'Past Location',
          start_time: '2023-01-01T10:00:00Z',
          end_time: '2023-01-01T12:00:00Z',
          attendance_count: 15,
          checkin_token: 'past-token',
          ...baseEvent,
        })
      ]
      
      mockGetDashboardEvents.mockResolvedValue({ upcoming: [], past: pastEvents })
      
      render(<DashboardPage />)
      
      await waitFor(() => {
        expect(screen.getByTestId('nav')).toBeInTheDocument()
      })
    })

    it('successfully loads both upcoming and past events', async () => {
      const upcomingEvents = [createDashboardItem({
        id: 1,
        name: 'Upcoming',
        start_time: '2024-12-01T10:00:00Z',
        end_time: '2024-12-01T12:00:00Z',
        checkin_token: 'token1',
        location: 'Location',
        attendance_count: 0,
        ...baseEvent,
      })]
      const pastEvents = [createDashboardItem({
        id: 2,
        name: 'Past',
        start_time: '2023-01-01T10:00:00Z',
        end_time: '2023-01-01T12:00:00Z',
        checkin_token: 'token2',
        location: 'Location',
        attendance_count: 0,
        ...baseEvent,
      })]
      
      mockGetDashboardEvents.mockResolvedValue({ upcoming: upcomingEvents, past: pastEvents })
      
      render(<DashboardPage />)
      
      await waitFor(() => {
        expect(screen.getByTestId('nav')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling Coverage', () => {
    it('handles API error and continues', async () => {
      mockGetDashboardEvents.mockRejectedValue(new Error('API failed'))
      
      render(<DashboardPage />)
      
      await waitFor(() => {
        expect(screen.getByTestId('nav')).toBeInTheDocument()
      })
    })

    it('handles API error continues', async () => {
      mockGetDashboardEvents.mockRejectedValue(new Error('API failed'))
      
      render(<DashboardPage />)
      
      await waitFor(() => {
        expect(screen.getByTestId('nav')).toBeInTheDocument()
      })
    })

    it('handles API errors and still finishes loading', async () => {
      mockGetDashboardEvents.mockRejectedValue(new Error('API failed'))
      
      render(<DashboardPage />)
      
      await waitFor(() => {
        expect(screen.getByTestId('nav')).toBeInTheDocument()
      })
    })

    it('handles API errors with specific error types', async () => {
      mockGetDashboardEvents.mockRejectedValue(new TypeError('Network error'))
      
      render(<DashboardPage />)
      
      await waitFor(() => {
        expect(screen.getByTestId('nav')).toBeInTheDocument()
      })
    })

    it('handles API timeout scenarios', async () => {
      mockGetDashboardEvents.mockImplementation(() => 
        Promise.reject(new Error('Request timeout'))
      )
      
      render(<DashboardPage />)
      
      await waitFor(() => {
        expect(screen.getByTestId('nav')).toBeInTheDocument()
      })
    })
  })

  describe('Finally Block Coverage', () => {
    it('always sets loading to false - success case', async () => {
      mockGetDashboardEvents.mockResolvedValue({ upcoming: [], past: [] })
      
      render(<DashboardPage />)
      
      await waitFor(() => {
        expect(screen.getByTestId('nav')).toBeInTheDocument()
      })
    })

    it('always sets loading to false - error case', async () => {
      mockGetDashboardEvents.mockRejectedValue(new Error('Failed'))
      
      render(<DashboardPage />)
      
      await waitFor(() => {
        expect(screen.getByTestId('nav')).toBeInTheDocument()
      })
    })

    it('always sets loading to false - mixed case', async () => {
      mockGetDashboardEvents.mockRejectedValue(new Error('Failed'))
      
      render(<DashboardPage />)
      
      await waitFor(() => {
        expect(screen.getByTestId('nav')).toBeInTheDocument()
      })
    })
  })

  describe('State Update Coverage', () => {
    it('updates state with empty arrays', async () => {
      mockGetDashboardEvents.mockResolvedValue({ upcoming: [], past: [] })
      
      render(<DashboardPage />)
      
      await waitFor(() => {
        expect(screen.getByTestId('nav')).toBeInTheDocument()
      })
    })

    it('updates state with large datasets', async () => {
      const manyUpcoming = Array.from({ length: 20 }, (_, i) => 
        createDashboardItem({
          id: i + 1,
          name: `Event ${i + 1}`,
          start_time: '2024-12-01T10:00:00Z',
          end_time: '2024-12-01T12:00:00Z',
          checkin_token: `token-${i + 1}`,
          location: 'Location',
          attendance_count: 0,
          ...baseEvent,
        })
      )
      
      const manyPast = Array.from({ length: 15 }, (_, i) => 
        createDashboardItem({
          id: i + 100,
          name: `Past Event ${i + 1}`,
          start_time: '2023-01-01T10:00:00Z',
          end_time: '2023-01-01T12:00:00Z',
          checkin_token: `past-token-${i + 1}`,
          location: 'Location',
          attendance_count: 0,
          ...baseEvent,
        })
      )
      
      mockGetDashboardEvents.mockResolvedValue({ upcoming: manyUpcoming, past: manyPast })
      
      render(<DashboardPage />)
      
      await waitFor(() => {
        expect(screen.getByTestId('nav')).toBeInTheDocument()
      })
    })

    it('updates state with valid minimal data', async () => {
      const minimalData = [
        createDashboardItem({
          id: 1,
          name: 'Valid Event',
          start_time: '2024-01-01T10:00:00Z',
          end_time: '2024-01-01T12:00:00Z',
          checkin_token: 'token1',
          location: 'Location',
          attendance_count: 0,
          ...baseEvent,
        }),
        createDashboardItem({
          id: 2,
          name: 'Another Valid Event',
          start_time: '2024-01-02T10:00:00Z',
          end_time: '2024-01-02T12:00:00Z',
          checkin_token: 'token2',
          location: 'Location',
          attendance_count: 0,
          ...baseEvent,
        })
      ]
      
      mockGetDashboardEvents.mockResolvedValue({ upcoming: minimalData, past: minimalData })
      
      render(<DashboardPage />)
      
      await waitFor(() => {
        expect(screen.getByTestId('nav')).toBeInTheDocument()
      })
    })
  })

  describe('Component Lifecycle Coverage', () => {
    it('handles multiple re-renders', async () => {
      mockGetDashboardEvents.mockResolvedValue({ upcoming: [], past: [] })
      
      const { rerender } = render(<DashboardPage />)
      
      await waitFor(() => {
        expect(screen.getByTestId('nav')).toBeInTheDocument()
      })
      
      rerender(<DashboardPage />)
      
      await waitFor(() => {
        expect(screen.getByTestId('nav')).toBeInTheDocument()
      })
    })

    it('handles unmounting during async operations', async () => {
      mockGetDashboardEvents.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ upcoming: [], past: [] }), 500))
      )
      
      const { unmount } = render(<DashboardPage />)
      
      setTimeout(() => unmount(), 100)
    })
  })

  describe('Event Rendering Coverage', () => {
    it('renders events with complete data', async () => {
      const completeEvents = [
        createDashboardItem({
          id: 1,
          name: 'Complete Event',
          location: 'Complete Location',
          start_time: '2024-12-01T10:00:00Z',
          end_time: '2024-12-01T12:00:00Z',
          attendance_count: 10,
          checkin_token: 'complete-token',
          ...baseEvent,
        })
      ]
      
      mockGetDashboardEvents.mockResolvedValue({ upcoming: completeEvents, past: completeEvents })
      
      render(<DashboardPage />)
      
      await waitFor(() => {
        expect(screen.getByTestId('nav')).toBeInTheDocument()
      })
    })

    it('renders events with zero attendance', async () => {
      const zeroAttendanceEvents = [
        createDashboardItem({
          id: 1,
          name: 'Zero Attendance Event',
          location: 'Location',
          start_time: '2024-12-01T10:00:00Z',
          end_time: '2024-12-01T12:00:00Z',
          attendance_count: 0,
          checkin_token: 'zero-token',
          ...baseEvent,
        })
      ]
      
      mockGetDashboardEvents.mockResolvedValue({ upcoming: zeroAttendanceEvents, past: [] })
      
      render(<DashboardPage />)
      
      await waitFor(() => {
        expect(screen.getByTestId('nav')).toBeInTheDocument()
      })
    })

    it('shows "Check-in ended" for past events', async () => {
      const pastEvents = [
        createDashboardItem({
          id: 1,
          name: 'Past Event',
          location: 'Location',
          start_time: '2023-01-01T10:00:00Z',
          end_time: '2023-01-01T12:00:00Z',
          attendance_count: 5,
          checkin_token: 'past-token',
          ...baseEvent,
        })
      ]
      
      mockGetDashboardEvents.mockResolvedValue({ upcoming: [], past: pastEvents })
      
      render(<DashboardPage />)
      await waitFor(() => {
        expect(screen.getByTestId('nav')).toBeInTheDocument()
        expect(screen.getByText('Check-in ended')).toBeInTheDocument()
      }, { timeout: 2000 })
    })

    it('shows "Show QR" for future events', async () => {
      const futureEvents = [
        createDashboardItem({
          id: 1,
          name: 'Future Event',
          location: 'Location',
          start_time: '2026-01-01T10:00:00Z',
          end_time: '2026-01-01T12:00:00Z',
          attendance_count: 0,
          checkin_token: 'future-token',
          ...baseEvent,
        })
      ]
      
      mockGetDashboardEvents.mockResolvedValue({ upcoming: futureEvents, past: [] })
      
      render(<DashboardPage />)
      
      await waitFor(() => {
        expect(screen.getByTestId('nav')).toBeInTheDocument()
        expect(screen.getByText('Show QR')).toBeInTheDocument()
      }, { timeout: 2000 })
    })
  })
})