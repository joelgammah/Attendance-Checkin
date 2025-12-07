import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import '@testing-library/jest-dom'

// Mock all page components used by App
vi.mock('../pages/LoginPage', () => ({ default: () => <div>Login Page</div> }))
vi.mock('../pages/EventFormPage', () => ({ default: () => <div>Event Form Page</div> }))
vi.mock('../pages/EventDetailPage', () => ({ default: () => <div>Event Detail Page</div> }))
vi.mock('../pages/CheckInPage', () => ({ default: () => <div>Check In Page</div> }))
vi.mock('../pages/CheckInStart', () => ({ default: () => <div>Check In Start Page</div> }))
vi.mock('../pages/DashboardPage', () => ({ default: () => <div>Dashboard Page</div> }))
vi.mock('../pages/AttendeeDashboard', () => ({ default: () => <div>Attendee Dashboard</div> }))
vi.mock('../pages/Callback', () => ({ default: () => <div>Callback Page</div> }))
vi.mock('../pages/EmailVerificationSuccess', () => ({ default: () => <div>Email Verified</div> }))
vi.mock('../pages/EventAttendeesPage', () => ({ default: () => <div>Event Attendees</div> }))
vi.mock('../pages/EventFamilyPage', () => ({ default: () => <div>Event Family</div> }))
vi.mock('../pages/AttendeeEventOverview', () => ({ default: () => <div>Attendee Event Overview</div> }))
vi.mock('../pages/AdminDashboardPage', () => ({ default: () => <div>Admin Dashboard</div> }))

// Mock Protected component
vi.mock('../components/Protected', () => ({
  default: ({ children }: any) => <div data-testid="protected">{children}</div>
}))

// Mock auth helpers
vi.mock('../api/auth', () => ({
  getUserRole: vi.fn(() => 'organizer'),
  getActiveRole: vi.fn(() => 'organizer'),
  getUserRoles: vi.fn(() => ['organizer', 'attendee'])
}))

import App from '../App'
import { getUserRole, getActiveRole } from '../api/auth'

const mockGetUserRole = getUserRole as any
const mockGetActiveRole = getActiveRole as any

function setPath(path: string) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

describe('App Routing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows login page for /login route', () => {
    setPath('/login')
    render(<App />)
    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })

  it('shows event form for /events/new route', () => {
    setPath('/events/new')
    render(<App />)
    expect(screen.getByText('Event Form Page')).toBeInTheDocument()
    expect(screen.getByTestId('protected')).toBeInTheDocument()
  })

  it('shows event detail for /events/token route', () => {
    setPath('/events/abc123')
    render(<App />)
    expect(screen.getByText('Event Detail Page')).toBeInTheDocument()
  })

  it('shows check-in start for /checkin/start route', () => {
    setPath('/checkin/start')
    render(<App />)
    expect(screen.getByText('Check In Start Page')).toBeInTheDocument()
  })

  it('shows check-in page for /checkin route', () => {
    setPath('/checkin?token=abc123')
    render(<App />)
    expect(screen.getByText('Check In Page')).toBeInTheDocument()
  })

  it('shows organizer dashboard by default for organizer role', () => {
    mockGetUserRole.mockReturnValue('organizer')
    mockGetActiveRole.mockReturnValue('organizer')
    setPath('/')
    render(<App />)
    expect(screen.getByText('Dashboard Page')).toBeInTheDocument()
  })

  it('shows attendee dashboard for attendee role', () => {
    mockGetUserRole.mockReturnValue('attendee')
    mockGetActiveRole.mockReturnValue('attendee')
    setPath('/')
    render(<App />)
    expect(screen.getByText('Attendee Dashboard')).toBeInTheDocument()
  })
})