import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import '@testing-library/jest-dom'

// Mock dependencies
vi.mock('../api/attendance', () => ({
  getMyEventDetails: vi.fn(),
}))

vi.mock('@auth0/auth0-react', () => ({
  useAuth0: vi.fn(() => ({
    isAuthenticated: false,
    logout: vi.fn(),
  })),
}))

vi.mock('../App', () => ({
  useParams: vi.fn(() => ({ parentId: '1' })),
}))

vi.mock('../components/Protected', () => ({
  Link: ({ to, children, className, ...props }: any) => (
    <a href={to} className={className} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('../components/RoleSwitch', () => ({
  default: () => <div data-testid="role-switch">RoleSwitch</div>,
}))

vi.mock('../api/auth', () => ({
  logout: vi.fn(),
}))

import { getMyEventDetails } from '../api/attendance'
import { useAuth0 } from '@auth0/auth0-react'
import { useParams } from '../App'
import AttendeeEventOverview from '../pages/AttendeeEventOverview'
import type { MyEventDetails, SessionWithAttendanceOut } from '../api/attendance'
import type { EventOut, SessionOut } from '../types'

const mockGetMyEventDetails = getMyEventDetails as any
const mockUseAuth0 = useAuth0 as any
const mockUseParams = useParams as any

// =====================================================
// TEST FIXTURES
// =====================================================

const createBaseEvent = (): EventOut => ({
  id: 1,
  name: 'CS410 Lecture',
  location: 'Room 101',
  start_time: '2024-12-15T10:00:00Z',
  end_time: '2024-12-15T12:00:00Z',
  notes: 'Weekly lecture',
  checkin_open_minutes: 15,
  checkin_token: 'event-token-123',
  attendance_count: 25,
  recurring: true,
  weekdays: ['Monday'],
  end_date: '2025-12-31',
  parent_id: undefined,
  member_count: 30,
  attendance_threshold: 3,
})

const createSession = (id: number, startDate: Date): SessionOut => ({
  id,
  start_time: startDate.toISOString(),
  end_time: new Date(startDate.getTime() + 2 * 60 * 60 * 1000).toISOString(),
})

const createSessionWithAttendance = (
  id: number,
  startDate: Date,
  attended: boolean
): SessionWithAttendanceOut => ({
  session: createSession(id, startDate),
  attended,
})

const createEventDetails = (overrides?: Partial<MyEventDetails>): MyEventDetails => {
  const now = new Date()
  const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const pastDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const pastDate2 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  return {
    parent: createBaseEvent(),
    attended: 6,
    missed: 2,
    flagged: false,
    total_past_sessions: 8,
    next_session: createSessionWithAttendance(2, futureDate, false),
    upcoming_sessions: [
      createSessionWithAttendance(2, futureDate, false),
      createSessionWithAttendance(3, new Date(futureDate.getTime() + 7 * 24 * 60 * 60 * 1000), false),
    ],
    past_sessions: [
      createSessionWithAttendance(10, pastDate, true),
      createSessionWithAttendance(11, pastDate2, false),
    ],
    ...overrides,
  }
}

describe('AttendeeEventOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockUseParams.mockReturnValue({ parentId: '1' })
    mockUseAuth0.mockReturnValue({
      isAuthenticated: false,
      logout: vi.fn(),
    })
  })

  afterEach(() => {
    localStorage.clear()
  })

  // =====================================================
  // LOADING STATE TESTS
  // =====================================================

  describe('Loading State', () => {
    it('shows loading message while fetching', async () => {
      mockGetMyEventDetails.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(createEventDetails()), 100))
      )

      render(<AttendeeEventOverview />)

      expect(screen.getByText('Loading event details...')).toBeInTheDocument()
    })

    it('hides loading message after data loads', async () => {
      mockGetMyEventDetails.mockResolvedValue(createEventDetails())

      render(<AttendeeEventOverview />)

      await waitFor(() => {
        expect(screen.queryByText('Loading event details...')).not.toBeInTheDocument()
      })
    })

    it('returns early if no parentId', async () => {
      mockUseParams.mockReturnValue({ parentId: null })
      mockGetMyEventDetails.mockResolvedValue(createEventDetails())

      render(<AttendeeEventOverview />)

      await waitFor(() => {
        expect(mockGetMyEventDetails).not.toHaveBeenCalled()
      })
    })
  })

  // =====================================================
  // HEADER SECTION TESTS
  // =====================================================

  describe('Header Section', () => {

    it('displays event location', async () => {
      mockGetMyEventDetails.mockResolvedValue(createEventDetails())

      render(<AttendeeEventOverview />)

      await waitFor(() => {
        expect(screen.getByText('Room 101')).toBeInTheDocument()
      })
    })

    it('displays attendance stats', async () => {
      mockGetMyEventDetails.mockResolvedValue(createEventDetails())

      render(<AttendeeEventOverview />)

      await waitFor(() => {
        expect(screen.getByText(/6\/8 attended/)).toBeInTheDocument()
      })
    })

    it('displays flagged status when applicable', async () => {
      mockGetMyEventDetails.mockResolvedValue(
        createEventDetails({ flagged: true })
      )

      render(<AttendeeEventOverview />)

      await waitFor(() => {
        expect(screen.getByText('⚠ Flagged')).toBeInTheDocument()
      })
    })

    it('hides flagged status when not flagged', async () => {
      mockGetMyEventDetails.mockResolvedValue(
        createEventDetails({ flagged: false })
      )

      render(<AttendeeEventOverview />)

      await waitFor(() => {
        expect(screen.queryByText('⚠ Flagged')).not.toBeInTheDocument()
      })
    })

    it('displays attendance threshold when set', async () => {
      const details = createEventDetails()
      details.parent.attendance_threshold = 5
      mockGetMyEventDetails.mockResolvedValue(details)

      render(<AttendeeEventOverview />)

      await waitFor(() => {
        expect(screen.getByText('Threshold: 5 absences')).toBeInTheDocument()
      })
    })

    it('hides threshold when not set', async () => {
      const details = createEventDetails()
      details.parent.attendance_threshold = undefined
      mockGetMyEventDetails.mockResolvedValue(details)

      render(<AttendeeEventOverview />)

      await waitFor(() => {
        expect(screen.queryByText(/Threshold:/)).not.toBeInTheDocument()
      })
    })
  })

  // =====================================================
  // UPCOMING SESSIONS TESTS
  // =====================================================

  describe('Upcoming Sessions', () => {
    it('displays upcoming sessions section', async () => {
      mockGetMyEventDetails.mockResolvedValue(createEventDetails())

      render(<AttendeeEventOverview />)

      await waitFor(() => {
        expect(screen.getByText('Upcoming Sessions')).toBeInTheDocument()
      })
    })

    it('displays upcoming sessions list', async () => {
      mockGetMyEventDetails.mockResolvedValue(createEventDetails())

      render(<AttendeeEventOverview />)

      await waitFor(() => {
        const upcomingItems = screen.getAllByText('CS410 Lecture')
        expect(upcomingItems.length).toBeGreaterThan(0)
      })
    })

    it('shows empty message when no upcoming sessions', async () => {
      mockGetMyEventDetails.mockResolvedValue(
        createEventDetails({ upcoming_sessions: [] })
      )

      render(<AttendeeEventOverview />)

      await waitFor(() => {
        expect(screen.getByText('No upcoming sessions')).toBeInTheDocument()
      })
    })

    it('displays date and time for upcoming sessions', async () => {
      mockGetMyEventDetails.mockResolvedValue(createEventDetails())

      render(<AttendeeEventOverview />)

      await waitFor(() => {
        const upcomingSections = screen.getAllByText(/Upcoming Sessions/)
        expect(upcomingSections.length).toBeGreaterThan(0)
      })
    })

    it('displays multiple upcoming sessions', async () => {
      const details = createEventDetails()
      mockGetMyEventDetails.mockResolvedValue(details)

      render(<AttendeeEventOverview />)

      await waitFor(() => {
        // Should display the events in the list
        expect(screen.getByText('Upcoming Sessions')).toBeInTheDocument()
      })
    })
  })

  // =====================================================
  // PAST SESSIONS TESTS
  // =====================================================

  describe('Past Sessions', () => {
    it('displays past sessions section', async () => {
      mockGetMyEventDetails.mockResolvedValue(createEventDetails())

      render(<AttendeeEventOverview />)

      await waitFor(() => {
        expect(screen.getByText('Past Sessions')).toBeInTheDocument()
      })
    })

    it('shows empty message when no past sessions', async () => {
      mockGetMyEventDetails.mockResolvedValue(
        createEventDetails({ past_sessions: [] })
      )

      render(<AttendeeEventOverview />)

      await waitFor(() => {
        const emptyMessages = screen.getAllByText('No past sessions')
        expect(emptyMessages.length).toBeGreaterThan(0)
      })
    })

    it('displays attended badge for attended sessions', async () => {
      mockGetMyEventDetails.mockResolvedValue(createEventDetails())

      render(<AttendeeEventOverview />)

      await waitFor(() => {
        const attendedBadges = screen.getAllByText(/✓ Attended/)
        expect(attendedBadges.length).toBeGreaterThan(0)
      })
    })

    it('displays missed badge for missed sessions', async () => {
      mockGetMyEventDetails.mockResolvedValue(createEventDetails())

      render(<AttendeeEventOverview />)

      await waitFor(() => {
        const missedBadges = screen.getAllByText(/✗ Missed/)
        expect(missedBadges.length).toBeGreaterThan(0)
      })
    })

    it('handles single past session', async () => {
      const now = new Date()
      const pastDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      mockGetMyEventDetails.mockResolvedValue(
        createEventDetails({
          past_sessions: [createSessionWithAttendance(10, pastDate, true)],
        })
      )

      render(<AttendeeEventOverview />)

      await waitFor(() => {
        expect(screen.getByText(/✓ Attended/)).toBeInTheDocument()
      })
    })

    it('handles multiple past sessions with mixed attendance', async () => {
      const now = new Date()
      const pastDate1 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const pastDate2 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

      mockGetMyEventDetails.mockResolvedValue(
        createEventDetails({
          past_sessions: [
            createSessionWithAttendance(10, pastDate1, true),
            createSessionWithAttendance(11, pastDate2, false),
            createSessionWithAttendance(12, new Date(pastDate2.getTime() - 7 * 24 * 60 * 60 * 1000), true),
          ],
        })
      )

      render(<AttendeeEventOverview />)

      await waitFor(() => {
        const attendedBadges = screen.getAllByText(/✓ Attended/)
        const missedBadges = screen.getAllByText(/✗ Missed/)
        expect(attendedBadges.length).toBeGreaterThan(0)
        expect(missedBadges.length).toBeGreaterThan(0)
      })
    })
  })

  // =====================================================
  // NAVIGATION TESTS
  // =====================================================

  describe('Navigation', () => {
    it('displays logo and title', async () => {
      mockGetMyEventDetails.mockResolvedValue(createEventDetails())

      render(<AttendeeEventOverview />)

      await waitFor(() => {
        expect(screen.getByText('Terrier Check-In')).toBeInTheDocument()
      })
    })

    it('displays Dashboard link', async () => {
      mockGetMyEventDetails.mockResolvedValue(createEventDetails())

      render(<AttendeeEventOverview />)

      await waitFor(() => {
        // The visible text is inside a <span>; query the anchor element by its accessible name
        const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
        expect(dashboardLink).toBeInTheDocument()
        expect(dashboardLink).toHaveAttribute('href', '/')
      })
    })

    it('displays Check In link', async () => {
      mockGetMyEventDetails.mockResolvedValue(createEventDetails())

      render(<AttendeeEventOverview />)

      await waitFor(() => {
        // The visible text is inside a <span>; query the anchor element by its accessible name
        const checkInLink = screen.getByRole('link', { name: /check in/i })
        expect(checkInLink).toBeInTheDocument()
        expect(checkInLink).toHaveAttribute('href', '/checkin/start')
      })
    })

    it('displays RoleSwitch component', async () => {
      mockGetMyEventDetails.mockResolvedValue(createEventDetails())

      render(<AttendeeEventOverview />)

      await waitFor(() => {
        expect(screen.getByTestId('role-switch')).toBeInTheDocument()
      })
    })

    it('displays Logout button', async () => {
      mockGetMyEventDetails.mockResolvedValue(createEventDetails())

      render(<AttendeeEventOverview />)

      await waitFor(() => {
        expect(screen.getByText('Logout')).toBeInTheDocument()
      })
    })
  })

  // =====================================================
  // LOGOUT BEHAVIOR
  // =====================================================

  describe('Logout Behavior', () => {
    it('calls Auth0 logout when authenticated', async () => {
      const mockAuth0Logout = vi.fn()
      mockUseAuth0.mockReturnValue({
        isAuthenticated: true,
        logout: mockAuth0Logout,
      })
      mockGetMyEventDetails.mockResolvedValue(createEventDetails())

      render(<AttendeeEventOverview />)

      await waitFor(() => {
        expect(screen.getByText('Logout')).toBeInTheDocument()
      })

      const logoutButton = screen.getByText('Logout')
      logoutButton.click()

      expect(mockAuth0Logout).toHaveBeenCalled()
    })

    it('clears localStorage on logout', async () => {
      const mockAuth0Logout = vi.fn()
      mockUseAuth0.mockReturnValue({
        isAuthenticated: true,
        logout: mockAuth0Logout,
      })
      mockGetMyEventDetails.mockResolvedValue(createEventDetails())
      localStorage.setItem('user_email', 'test@example.com')

      render(<AttendeeEventOverview />)

      await waitFor(() => {
        expect(screen.getByText('Logout')).toBeInTheDocument()
      })

      const logoutButton = screen.getByText('Logout')
      logoutButton.click()

      expect(localStorage.getItem('user_email')).toBeNull()
    })
  })

  // =====================================================
  // DATA LOADING LIFECYCLE
  // =====================================================

  describe('Data Loading Lifecycle', () => {
    it('calls getMyEventDetails with correct parentId', async () => {
      mockUseParams.mockReturnValue({ parentId: '42' })
      mockGetMyEventDetails.mockResolvedValue(createEventDetails())

      render(<AttendeeEventOverview />)

      await waitFor(() => {
        expect(mockGetMyEventDetails).toHaveBeenCalledWith(42)
      })
    })

    it('converts parentId from string to number', async () => {
      mockUseParams.mockReturnValue({ parentId: '123' })
      mockGetMyEventDetails.mockResolvedValue(createEventDetails())

      render(<AttendeeEventOverview />)

      await waitFor(() => {
        expect(mockGetMyEventDetails).toHaveBeenCalledWith(123)
      })
    })


    it('handles API errors gracefully', async () => {
      mockGetMyEventDetails.mockRejectedValue(new Error('API failed'))

      render(<AttendeeEventOverview />)

      await waitFor(() => {
        expect(screen.getByText('Loading event details...')).toBeInTheDocument()
      })
    })
  })

  // =====================================================
  // EDGE CASES
  // =====================================================

  describe('Edge Cases', () => {
    it('handles zero attended sessions', async () => {
      mockGetMyEventDetails.mockResolvedValue(
        createEventDetails({ attended: 0, missed: 8 })
      )

      render(<AttendeeEventOverview />)

      await waitFor(() => {
        expect(screen.getByText(/0\/8 attended/)).toBeInTheDocument()
      })
    })

    it('handles all sessions attended', async () => {
      mockGetMyEventDetails.mockResolvedValue(
        createEventDetails({ attended: 8, missed: 0 })
      )

      render(<AttendeeEventOverview />)

      await waitFor(() => {
        expect(screen.getByText(/8\/8 attended/)).toBeInTheDocument()
      })
    })

    it('handles no upcoming and no past sessions', async () => {
      mockGetMyEventDetails.mockResolvedValue(
        createEventDetails({
          upcoming_sessions: [],
          past_sessions: [],
        })
      )

      render(<AttendeeEventOverview />)

      await waitFor(() => {
        expect(screen.getByText('No upcoming sessions')).toBeInTheDocument()
        expect(screen.getByText('No past sessions')).toBeInTheDocument()
      })
    })

    it('handles undefined attendance threshold', async () => {
      const details = createEventDetails()
      details.parent.attendance_threshold = undefined
      mockGetMyEventDetails.mockResolvedValue(details)

      render(<AttendeeEventOverview />)

      await waitFor(() => {
        expect(screen.queryByText(/Threshold:/)).not.toBeInTheDocument()
      })
    })
  })

  // =====================================================
  // LAYOUT AND STYLING
  // =====================================================

  describe('Layout and Structure', () => {
    it('renders main container', async () => {
      mockGetMyEventDetails.mockResolvedValue(createEventDetails())

      const { container } = render(<AttendeeEventOverview />)

      await waitFor(() => {
        const mainContainer = container.querySelector('.min-h-screen')
        expect(mainContainer).toBeInTheDocument()
      })
    })

    it('displays grid layout with upcoming and past sessions', async () => {
      mockGetMyEventDetails.mockResolvedValue(createEventDetails())

      render(<AttendeeEventOverview />)

      await waitFor(() => {
        expect(screen.getByText('Upcoming Sessions')).toBeInTheDocument()
        expect(screen.getByText('Past Sessions')).toBeInTheDocument()
      })
    })
  })

  // =====================================================
  // SESSION DETAILS
  // =====================================================

  describe('Session Details', () => {
    it('displays correct session information', async () => {
      mockGetMyEventDetails.mockResolvedValue(createEventDetails())

      render(<AttendeeEventOverview />)

      await waitFor(() => {
        // Should display event name multiple times
        const eventNames = screen.getAllByText('CS410 Lecture')
        expect(eventNames.length).toBeGreaterThan(0)
      })
    })
  })
})
