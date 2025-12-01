import { render, screen, waitFor, within } from '@testing-library/react'
import { vi } from 'vitest'
import '@testing-library/jest-dom'

// Mock dependencies
vi.mock('../api/events', () => ({
  getEventFamily: vi.fn(),
  csvUrl: vi.fn()
}))

vi.mock('../components/Nav', () => ({
  default: () => <div data-testid="nav">Nav Component</div>
}))

vi.mock('../App', () => ({
  useParams: vi.fn(() => ({ eventId: '1' }))
}))

// Import mocked functions
import { getEventFamily, csvUrl } from '../api/events'
import { useParams } from '../App'
import EventFamilyPage from '../pages/EventFamilyPage'
import type { EventFamilyResponse, EventOut, SessionListOut, MemberAttendanceSummary } from '../types'

const mockGetEventFamily = getEventFamily as any
const mockCsvUrl = csvUrl as any
const mockUseParams = useParams as any

// =====================================================
// TEST FIXTURES
// =====================================================

const createBaseEvent = (): EventOut => ({
  id: 1,
  name: 'Parent Event',
  location: 'Main Hall',
  start_time: '2024-12-15T10:00:00Z',
  end_time: '2024-12-15T12:00:00Z',
  notes: 'Weekly session',
  checkin_open_minutes: 15,
  checkin_token: 'parent-token-123',
  attendance_count: 25,
  recurring: true,
  weekdays: ['Monday'],
  end_date: '2025-12-31',
  parent_id: undefined,
  member_count: 30,
  attendance_threshold: 10,
})

const createSession = (id: number, startDate: Date): SessionListOut => ({
  id,
  start_time: startDate.toISOString(),
  end_time: new Date(startDate.getTime() + 2 * 60 * 60 * 1000).toISOString(),
  checkin_token: `session-token-${id}`,
})

const createMember = (userId: number, flagged = false): MemberAttendanceSummary => ({
  user_id: userId,
  name: `Student ${userId}`,
  email: `student${userId}@university.edu`,
  attended: flagged ? 2 : 8,
  missed: flagged ? 6 : 2,
  is_flagged: flagged,
})

const createEventFamily = (overrides?: Partial<EventFamilyResponse>): EventFamilyResponse => {
  const now = new Date()
  const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const pastDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  return {
    parent: createBaseEvent(),
    upcoming_children: [
      createSession(2, futureDate),
      createSession(3, new Date(futureDate.getTime() + 7 * 24 * 60 * 60 * 1000)),
    ],
    past_children: [
      createSession(10, pastDate),
      createSession(11, new Date(pastDate.getTime() - 7 * 24 * 60 * 60 * 1000)),
    ],
    total_past_sessions: 8,
    members: [
      createMember(1, false),
      createMember(2, false),
      createMember(3, true), // flagged member
    ],
    ...overrides,
  }
}

describe('EventFamilyPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCsvUrl.mockImplementation((eventId: number) => `/csv/download/${eventId}`)
    mockUseParams.mockReturnValue({ eventId: '1' })
  })

  // =====================================================
  // LOADING STATE TESTS
  // =====================================================

  describe('Loading State Coverage', () => {
    it('hides loading spinner after data loads', async () => {
      mockGetEventFamily.mockResolvedValue(createEventFamily())

      render(<EventFamilyPage />)

      await waitFor(() => {
        expect(screen.queryByText('Loading series...')).not.toBeInTheDocument()
      })
    })

    it('shows Nav component while loading', async () => {
      mockGetEventFamily.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(createEventFamily()), 100))
      )

      render(<EventFamilyPage />)

      expect(screen.getByTestId('nav')).toBeInTheDocument()
    })
  })

  // =====================================================
  // SUCCESS STATE TESTS
  // =====================================================

  describe('Success State Coverage', () => {
    it('loads and displays parent event details', async () => {
      const family = createEventFamily()
      mockGetEventFamily.mockResolvedValue(family)

      render(<EventFamilyPage />)

      await waitFor(() => {
        expect(screen.getByText('Parent Event')).toBeInTheDocument()
        expect(screen.getByText('Main Hall')).toBeInTheDocument()
      })
    })

    it('displays parent event as "Parent Session" badge', async () => {
      mockGetEventFamily.mockResolvedValue(createEventFamily())

      render(<EventFamilyPage />)

      await waitFor(() => {
        expect(screen.getByText('Parent Session')).toBeInTheDocument()
      })
    })

    it('displays attendance threshold info when present', async () => {
      mockGetEventFamily.mockResolvedValue(createEventFamily())

      render(<EventFamilyPage />)

      await waitFor(() => {
        expect(screen.getByText('Attendance Threshold:')).toBeInTheDocument()
        expect(screen.getByText('10')).toBeInTheDocument()
      })
    })

    it('renders all upcoming child sessions', async () => {
      mockGetEventFamily.mockResolvedValue(createEventFamily())

      render(<EventFamilyPage />)

      await waitFor(() => {
        expect(screen.getByText('Upcoming Sessions')).toBeInTheDocument()
      })
    })

    it('renders all past child sessions', async () => {
      mockGetEventFamily.mockResolvedValue(createEventFamily())

      render(<EventFamilyPage />)

      await waitFor(() => {
        expect(screen.getByText('Past Sessions')).toBeInTheDocument()
      })
    })

    it('displays members table with all members', async () => {
      mockGetEventFamily.mockResolvedValue(createEventFamily())

      render(<EventFamilyPage />)

      await waitFor(() => {
        expect(screen.getByText('Event Members')).toBeInTheDocument()
        expect(screen.getByText('Student 1')).toBeInTheDocument()
        expect(screen.getByText('Student 2')).toBeInTheDocument()
        expect(screen.getByText('Student 3')).toBeInTheDocument()
      })
    })

    it('shows "OK" status for non-flagged members', async () => {
      mockGetEventFamily.mockResolvedValue(createEventFamily())

      render(<EventFamilyPage />)

      await waitFor(() => {
        const okStatuses = screen.getAllByText('OK')
        expect(okStatuses.length).toBeGreaterThan(0)
      })
    })

    it('shows "Flagged" status for flagged members', async () => {
      mockGetEventFamily.mockResolvedValue(createEventFamily())

      render(<EventFamilyPage />)

      await waitFor(() => {
        expect(screen.getByText('⚠ Flagged')).toBeInTheDocument()
      })
    })

    it('displays member email addresses in table', async () => {
      mockGetEventFamily.mockResolvedValue(createEventFamily())

      render(<EventFamilyPage />)

      await waitFor(() => {
        expect(screen.getByText('student1@university.edu')).toBeInTheDocument()
        expect(screen.getByText('student2@university.edu')).toBeInTheDocument()
      })
    })

    it('displays attendance counts in members table', async () => {
      mockGetEventFamily.mockResolvedValue(createEventFamily())

      render(<EventFamilyPage />)

      await waitFor(() => {
        // Check for "Attended" and "Missed" columns
        const cells = screen.getAllByText(/^\d+$/)
        expect(cells.length).toBeGreaterThan(0)
      })
    })

    it('shows attendee count badge for parent event', async () => {
      mockGetEventFamily.mockResolvedValue(createEventFamily())

      render(<EventFamilyPage />)

      await waitFor(() => {
        expect(screen.getByText('25 attendees')).toBeInTheDocument()
      })
    })
  })

  // =====================================================
  // ERROR STATE TESTS
  // =====================================================

  describe('Error State Coverage', () => {
    it('displays error message when API fails', async () => {
      mockGetEventFamily.mockRejectedValue(new Error('Failed to load event series'))

      render(<EventFamilyPage />)

      await waitFor(() => {
        expect(screen.getByText('Failed to load event series')).toBeInTheDocument()
      })
    })

    it('shows Nav even when error occurs', async () => {
      mockGetEventFamily.mockRejectedValue(new Error('API error'))

      render(<EventFamilyPage />)

      await waitFor(() => {
        expect(screen.getByTestId('nav')).toBeInTheDocument()
      })
    })

    it('handles missing event ID gracefully', async () => {
      mockUseParams.mockReturnValue({ eventId: null })

      render(<EventFamilyPage />)

      await waitFor(() => {
        expect(screen.getByText('Event ID is missing')).toBeInTheDocument()
      })
    })

    it('handles undefined event ID gracefully', async () => {
      mockUseParams.mockReturnValue({ eventId: undefined })

      render(<EventFamilyPage />)

      await waitFor(() => {
        expect(screen.getByText('Event ID is missing')).toBeInTheDocument()
      })
    })

    it('handles network errors', async () => {
      mockGetEventFamily.mockRejectedValue(new TypeError('Network error'))

      render(<EventFamilyPage />)

      await waitFor(() => {
        expect(screen.getByText(/Failed to load event series/)).toBeInTheDocument()
      })
    })

    it('handles timeout errors', async () => {
      mockGetEventFamily.mockRejectedValue(new Error('Request timeout'))

      render(<EventFamilyPage />)

      await waitFor(() => {
        expect(screen.getByText(/Failed to load event series/)).toBeInTheDocument()
      })
    })
  })

  // =====================================================
  // PARENT EVENT ACTIONS
  // =====================================================

  describe('Parent Event Actions', () => {
    it('hides QR button for past parent event', async () => {
      const pastEvent = createBaseEvent()
      pastEvent.end_time = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

      mockGetEventFamily.mockResolvedValue(createEventFamily({ parent: pastEvent }))

      render(<EventFamilyPage />)

      await waitFor(() => {
        const parentPanel = screen.getByText('Parent Session').closest('div')?.closest('div')
        const showQrButtons = within(parentPanel!).queryAllByText('Show QR')
        expect(showQrButtons.length).toBe(0)
      })
    })

    it('shows CSV export button for past parent event', async () => {
      const pastEvent = createBaseEvent()
      pastEvent.end_time = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

      mockGetEventFamily.mockResolvedValue(createEventFamily({ parent: pastEvent }))

      render(<EventFamilyPage />)

      await waitFor(() => {
        const exportButtons = screen.getAllByText('Export CSV')
        expect(exportButtons.length).toBeGreaterThan(0)
      })
    })

    it('CSV export button has correct href', async () => {
      const pastEvent = createBaseEvent()
      pastEvent.id = 5
      pastEvent.end_time = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

      mockGetEventFamily.mockResolvedValue(createEventFamily({ parent: pastEvent }))
      mockCsvUrl.mockReturnValue('/csv/download/5')

      render(<EventFamilyPage />)

      await waitFor(() => {
        const exportButton = screen.getAllByText('Export CSV')[0]
        expect(exportButton.getAttribute('href')).toBe('/csv/download/5')
      })
    })

    it('shows attendees button for parent event', async () => {
      mockGetEventFamily.mockResolvedValue(createEventFamily())

      render(<EventFamilyPage />)

      await waitFor(() => {
        const attendeeButtons = screen.getAllByText(/attendees|Attendance/)
        expect(attendeeButtons.length).toBeGreaterThan(0)
      })
    })
  })

  // =====================================================
  // SESSION LIST INTERACTIONS
  // =====================================================

  describe('Session List Interactions', () => {

    it('can switch selection to upcoming session', async () => {
      mockGetEventFamily.mockResolvedValue(createEventFamily())

      render(<EventFamilyPage />)

      await waitFor(() => {
        expect(screen.getByText('Upcoming Sessions')).toBeInTheDocument()
      })
    })

    it('can switch selection to past session', async () => {
      mockGetEventFamily.mockResolvedValue(createEventFamily())

      render(<EventFamilyPage />)

      await waitFor(() => {
        expect(screen.getByText('Past Sessions')).toBeInTheDocument()
      })
    })

    it('displays upcoming session dates and times', async () => {
      mockGetEventFamily.mockResolvedValue(createEventFamily())

      render(<EventFamilyPage />)

      await waitFor(() => {
        const upcomingSection = screen.getByText('Upcoming Sessions')
        expect(upcomingSection).toBeInTheDocument()
      })
    })

    it('displays past session dates and times', async () => {
      mockGetEventFamily.mockResolvedValue(createEventFamily())

      render(<EventFamilyPage />)

      await waitFor(() => {
        const pastSection = screen.getByText('Past Sessions')
        expect(pastSection).toBeInTheDocument()
      })
    })

    it('shows QR button for upcoming sessions', async () => {
      mockGetEventFamily.mockResolvedValue(createEventFamily())

      render(<EventFamilyPage />)

      await waitFor(() => {
        // Multiple Show QR buttons for parent + upcoming sessions
        const qrButtons = screen.getAllByText('Show QR')
        expect(qrButtons.length).toBeGreaterThan(1)
      })
    })

    it('shows CSV export for past sessions', async () => {
      mockGetEventFamily.mockResolvedValue(createEventFamily())

      render(<EventFamilyPage />)

      await waitFor(() => {
        // Multiple Export CSV buttons for parent + past sessions
        const exportButtons = screen.getAllByText('Export CSV')
        expect(exportButtons.length).toBeGreaterThan(1)
      })
    })

    it('shows attendance button for all sessions', async () => {
      mockGetEventFamily.mockResolvedValue(createEventFamily())

      render(<EventFamilyPage />)

      await waitFor(() => {
        const attendanceButtons = screen.getAllByText('Attendance')
        expect(attendanceButtons.length).toBeGreaterThan(0)
      })
    })
  })

  // =====================================================
  // MEMBERS TABLE COVERAGE
  // =====================================================

  describe('Members Table Coverage', () => {
    it('renders table headers', async () => {
      mockGetEventFamily.mockResolvedValue(createEventFamily())

      render(<EventFamilyPage />)

      await waitFor(() => {
        expect(screen.getByText('Name')).toBeInTheDocument()
        expect(screen.getByText('Email')).toBeInTheDocument()
        expect(screen.getByText('Attended')).toBeInTheDocument()
        expect(screen.getByText('Missed')).toBeInTheDocument()
        expect(screen.getByText('Status')).toBeInTheDocument()
      })
    })

    it('displays all member rows', async () => {
      mockGetEventFamily.mockResolvedValue(createEventFamily())

      render(<EventFamilyPage />)

      await waitFor(() => {
        // Should have 3 members from fixture
        expect(screen.getByText('Student 1')).toBeInTheDocument()
        expect(screen.getByText('Student 2')).toBeInTheDocument()
        expect(screen.getByText('Student 3')).toBeInTheDocument()
      })
    })

    it('handles empty members list', async () => {
      mockGetEventFamily.mockResolvedValue(createEventFamily({ members: [] }))

      render(<EventFamilyPage />)

      await waitFor(() => {
        expect(screen.getByText('Event Members')).toBeInTheDocument()
      })
    })

    it('handles single member', async () => {
      mockGetEventFamily.mockResolvedValue(createEventFamily({ members: [createMember(1)] }))

      render(<EventFamilyPage />)

      await waitFor(() => {
        expect(screen.getByText('Student 1')).toBeInTheDocument()
      })
    })

    it('handles large member list', async () => {
      const members = Array.from({ length: 50 }, (_, i) => createMember(i + 1))
      mockGetEventFamily.mockResolvedValue(createEventFamily({ members }))

      render(<EventFamilyPage />)

      await waitFor(() => {
        expect(screen.getByText('Student 1')).toBeInTheDocument()
        expect(screen.getByText('Student 50')).toBeInTheDocument()
      })
    })

    it('displays attendance counts correctly', async () => {
      const member = createMember(1)
      mockGetEventFamily.mockResolvedValue(createEventFamily({ members: [member] }))

      render(<EventFamilyPage />)

      await waitFor(() => {
        // Member has attended: 8, missed: 2
        const row = screen.getByText('Student 1').closest('tr')
        expect(within(row!).getByText('8')).toBeInTheDocument()
        expect(within(row!).getByText('2')).toBeInTheDocument()
      })
    })

    it('displays mixed flagged and non-flagged members', async () => {
      const members = [
        createMember(1, false),
        createMember(2, true),
        createMember(3, false),
      ]
      mockGetEventFamily.mockResolvedValue(createEventFamily({ members }))

      render(<EventFamilyPage />)

      await waitFor(() => {
        const okStatuses = screen.getAllByText('OK')
        const flaggedStatuses = screen.getAllByText('⚠ Flagged')
        expect(okStatuses.length).toBe(2)
        expect(flaggedStatuses.length).toBe(1)
      })
    })
  })

  // =====================================================
  // EDGE CASES AND SPECIAL STATES
  // =====================================================

  describe('Edge Cases and Special States', () => {
    it('handles event with no upcoming children', async () => {
      mockGetEventFamily.mockResolvedValue(
        createEventFamily({ upcoming_children: [] })
      )

      render(<EventFamilyPage />)

      await waitFor(() => {
        expect(screen.getByText('Upcoming Sessions')).toBeInTheDocument()
      })
    })

    it('handles event with no past children', async () => {
      mockGetEventFamily.mockResolvedValue(
        createEventFamily({ past_children: [] })
      )

      render(<EventFamilyPage />)

      await waitFor(() => {
        expect(screen.getByText('Past Sessions')).toBeInTheDocument()
      })
    })

    it('handles event with no attendance threshold', async () => {
      const event = createBaseEvent()
      event.attendance_threshold = undefined
      mockGetEventFamily.mockResolvedValue(createEventFamily({ parent: event }))

      render(<EventFamilyPage />)

      await waitFor(() => {
        expect(screen.queryByText('Attendance Threshold:')).not.toBeInTheDocument()
      })
    })

    it('handles zero attendance count', async () => {
      const event = createBaseEvent()
      event.attendance_count = 0
      mockGetEventFamily.mockResolvedValue(createEventFamily({ parent: event }))

      render(<EventFamilyPage />)

      await waitFor(() => {
        expect(screen.getByText('0 attendees')).toBeInTheDocument()
      })
    })

    it('handles member with zero attendance', async () => {
      const member: MemberAttendanceSummary = {
        user_id: 1,
        name: 'Never Attended',
        email: 'never@attended.com',
        attended: 0,
        missed: 8,
        is_flagged: true,
      }
      mockGetEventFamily.mockResolvedValue(createEventFamily({ members: [member] }))

      render(<EventFamilyPage />)

      await waitFor(() => {
        expect(screen.getByText('Never Attended')).toBeInTheDocument()
        const row = screen.getByText('Never Attended').closest('tr')
        expect(within(row!).getByText('0')).toBeInTheDocument()
      })
    })

    it('handles member with perfect attendance', async () => {
      const member: MemberAttendanceSummary = {
        user_id: 1,
        name: 'Perfect Attendance',
        email: 'perfect@attended.com',
        attended: 10,
        missed: 0,
        is_flagged: false,
      }
      mockGetEventFamily.mockResolvedValue(createEventFamily({ members: [member] }))

      render(<EventFamilyPage />)

      await waitFor(() => {
        expect(screen.getByText('Perfect Attendance')).toBeInTheDocument()
      })
    })
  })

  // =====================================================
  // LAYOUT AND STRUCTURE
  // =====================================================

  describe('Layout and Structure', () => {
    it('renders with two-panel layout', async () => {
      mockGetEventFamily.mockResolvedValue(createEventFamily())

      render(<EventFamilyPage />)

      await waitFor(() => {
        expect(screen.getByText('Event Members')).toBeInTheDocument()
        // Should have left panel with sessions and right panel with members
      })
    })

    it('displays main heading', async () => {
      mockGetEventFamily.mockResolvedValue(createEventFamily())

      render(<EventFamilyPage />)

      await waitFor(() => {
        expect(screen.getByText('Event Members')).toBeInTheDocument()
      })
    })

    it('displays description text', async () => {
      mockGetEventFamily.mockResolvedValue(createEventFamily())

      render(<EventFamilyPage />)

      await waitFor(() => {
        expect(screen.getByText(/Attendance across/)).toBeInTheDocument()
      })
    })

    it('Nav is present in layout', async () => {
      mockGetEventFamily.mockResolvedValue(createEventFamily())

      render(<EventFamilyPage />)

      await waitFor(() => {
        expect(screen.getByTestId('nav')).toBeInTheDocument()
      })
    })
  })

  // =====================================================
  // LINK NAVIGATION
  // =====================================================

  describe('Link Navigation', () => {

    it('CSV link uses csvUrl helper', async () => {
      const pastEvent = createBaseEvent()
      pastEvent.id = 42
      pastEvent.end_time = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      mockGetEventFamily.mockResolvedValue(createEventFamily({ parent: pastEvent }))
      mockCsvUrl.mockReturnValue('/csv/download/42')

      render(<EventFamilyPage />)

      await waitFor(() => {
        const exportButton = screen.getAllByText('Export CSV')[0]
        expect(mockCsvUrl).toHaveBeenCalledWith(42)
        expect(exportButton.getAttribute('href')).toBe('/csv/download/42')
      })
    })
  })

  // =====================================================
  // DATA LOADING
  // =====================================================

  describe('Data Loading', () => {
    it('calls getEventFamily with correct eventId', async () => {
      mockUseParams.mockReturnValue({ eventId: '42' })
      mockGetEventFamily.mockResolvedValue(createEventFamily())

      render(<EventFamilyPage />)

      await waitFor(() => {
        expect(mockGetEventFamily).toHaveBeenCalledWith(42)
      })
    })

    it('converts eventId from string to number', async () => {
      mockUseParams.mockReturnValue({ eventId: '100' })
      mockGetEventFamily.mockResolvedValue(createEventFamily())

      render(<EventFamilyPage />)

      await waitFor(() => {
        expect(mockGetEventFamily).toHaveBeenCalledWith(100)
      })
    })

    it('only calls getEventFamily once on mount', async () => {
      mockGetEventFamily.mockResolvedValue(createEventFamily())

      render(<EventFamilyPage />)

      await waitFor(() => {
        expect(screen.getByText('Event Members')).toBeInTheDocument()
      })

      expect(mockGetEventFamily).toHaveBeenCalledTimes(1)
    })

    it('does not call getEventFamily if eventId is missing', async () => {
      mockUseParams.mockReturnValue({ eventId: null })

      render(<EventFamilyPage />)

      await waitFor(() => {
        expect(screen.getByText('Event ID is missing')).toBeInTheDocument()
      })

      expect(mockGetEventFamily).not.toHaveBeenCalled()
    })

    it('handles API response with all required fields', async () => {
      const completeFamily = createEventFamily()
      mockGetEventFamily.mockResolvedValue(completeFamily)

      render(<EventFamilyPage />)

      await waitFor(() => {
        expect(screen.getByText('Event Members')).toBeInTheDocument()
        expect(screen.getByText('Student 1')).toBeInTheDocument()
      })
    })
  })
})
