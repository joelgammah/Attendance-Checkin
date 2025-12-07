import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import '@testing-library/jest-dom'
import React from 'react'

// Mock attendance APIs used by AttendeeDashboard
vi.mock('../api/attendance', () => ({
  getMyCheckIns: vi.fn(),
  getMyEvents: vi.fn()
}))

// Mock Nav, Protected (default + Link) and RoleSwitch components
vi.mock('../components/Nav', () => ({
  default: () => <div data-testid="nav">Nav Component</div>
}))
vi.mock('../components/Protected', () => ({
  default: ({ children }: any) => <div data-testid="protected">{children}</div>,
  Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>
}))
vi.mock('../components/RoleSwitch', () => ({
  default: () => <div data-testid="roleswitch">RoleSwitch</div>
}))

// Mock auth0 hook
vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    isAuthenticated: false,
    logout: vi.fn(),
    user: { email: 'testuser@example.com' }
  })
}))

// Import the mocked functions
import { getMyCheckIns, getMyEvents } from '../api/attendance'
const mockGetMyCheckIns = getMyCheckIns as unknown as jest.Mock | any
const mockGetMyEvents = getMyEvents as unknown as jest.Mock | any

import AttendeeDashboard from '../pages/AttendeeDashboard'

describe('AttendeeDashboard Coverage Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with loading state', () => {
    mockGetMyCheckIns.mockImplementation(() => new Promise(() => {}))
    mockGetMyEvents.mockImplementation(() => new Promise(() => {}))

    const { container } = render(<AttendeeDashboard />)

    const nav = screen.queryByTestId('nav')
    const protected_ = screen.queryByTestId('protected')

    expect(nav || protected_ || container.firstChild).toBeTruthy()
  })

  it('renders with no events', async () => {
    mockGetMyCheckIns.mockResolvedValue([])
    mockGetMyEvents.mockResolvedValue([])

    const { container } = render(<AttendeeDashboard />)

    await waitFor(() => {
      expect(container.firstChild).toBeTruthy()
    })
  })

  it('renders with upcoming groups (events)', async () => {
    const groups = [
      {
        parent: { id: 'g1', name: 'Yoga Group', location: 'Gym' },
        next_session: { start_time: '2025-12-01T10:00:00Z' },
        total_past_sessions: 3
      }
    ]

    mockGetMyCheckIns.mockResolvedValue([])
    mockGetMyEvents.mockResolvedValue(groups)

    render(<AttendeeDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Yoga Group')).toBeInTheDocument()
      expect(screen.getByText('My Events')).toBeInTheDocument()
    })
  })

  it('renders with past check-ins', async () => {
    const checkIns = [
      {
        id: 1,
        event_name: 'Past Event',
        event_location: 'Hall A',
        checked_in_at: '2024-01-01T10:00:00Z'
      }
    ]

    mockGetMyCheckIns.mockResolvedValue(checkIns)
    mockGetMyEvents.mockResolvedValue([])

    render(<AttendeeDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Past Event')).toBeInTheDocument()
      expect(screen.getByText('Recent Check-ins')).toBeInTheDocument()
    })
  })

  it('handles API errors gracefully', async () => {
    mockGetMyCheckIns.mockRejectedValue(new Error('CheckIns failed'))
    mockGetMyEvents.mockRejectedValue(new Error('Events failed'))

    const { container } = render(<AttendeeDashboard />)

    await waitFor(() => {
      expect(container.firstChild).toBeTruthy()
    })
  })

  it('handles large datasets without crashing', async () => {
    const manyGroups = Array.from({ length: 20 }, (_, i) => ({
      parent: { id: `g${i+1}`, name: `Group ${i+1}`, location: `Loc ${i+1}` },
      next_session: null,
      total_past_sessions: i
    }))
    const manyCheckIns = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      event_name: `Event ${i+1}`,
      event_location: `Location ${i+1}`,
      checked_in_at: '2024-12-01T10:00:00Z'
    }))

    mockGetMyCheckIns.mockResolvedValue(manyCheckIns)
    mockGetMyEvents.mockResolvedValue(manyGroups)

    const { container } = render(<AttendeeDashboard />)

    await waitFor(() => {
      expect(container.firstChild).toBeTruthy()
    })
  })
})