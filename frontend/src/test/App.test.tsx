import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import '@testing-library/jest-dom'

// Mock all page components
vi.mock('../pages/LoginPage', () => ({ default: () => <div>Login Page</div> }))
vi.mock('../pages/EventFormPage', () => ({ default: () => <div>Event Form Page</div> }))
vi.mock('../pages/EventDetailPage', () => ({ default: () => <div>Event Detail Page</div> }))
vi.mock('../pages/CheckInPage', () => ({ default: () => <div>Check In Page</div> }))
vi.mock('../pages/CheckInStart', () => ({ default: () => <div>Check In Start Page</div> }))
vi.mock('../pages/DashboardPage', () => ({ default: () => <div>Dashboard Page</div> }))
vi.mock('../pages/AttendeeDashboard', () => ({ default: () => <div>Attendee Dashboard</div> }))

// Mock Protected component
vi.mock('../components/Protected', () => ({
  default: ({ children }: any) => <div data-testid="protected">{children}</div>
}))

// Mock auth
vi.mock('../api/auth', () => ({
  getUserRole: vi.fn(() => 'organizer'),
  getActiveRole: vi.fn(() => 'organizer'),
  getUserRoles: vi.fn(() => ['organizer', 'attendee'])
}))


import App from '../App'
import { getUserRole, getActiveRole } from '../api/auth'

const mockGetUserRole = getUserRole as any
const mockGetActiveRole = getActiveRole as any

describe('App Routing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows login page for /login route', () => {
    Object.defineProperty(window, 'location', {
      value: { pathname: '/login', search: '' },
      writable: true
    })
    
    render(<App />)
    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })

  it('shows event form for /events/new route', () => {
    Object.defineProperty(window, 'location', {
      value: { pathname: '/events/new', search: '' },
      writable: true
    })
    
    render(<App />)
    expect(screen.getByText('Event Form Page')).toBeInTheDocument()
    expect(screen.getByTestId('protected')).toBeInTheDocument()
  })

  it('shows event detail for /events/token route', () => {
    Object.defineProperty(window, 'location', {
      value: { pathname: '/events/abc123', search: '' },
      writable: true
    })
    
    render(<App />)
    expect(screen.getByText('Event Detail Page')).toBeInTheDocument()
  })

  it('shows check-in start for /checkin/start route', () => {
    Object.defineProperty(window, 'location', {
      value: { pathname: '/checkin/start', search: '' },
      writable: true
    })
    
    render(<App />)
    expect(screen.getByText('Check In Start Page')).toBeInTheDocument()
  })

  it('shows check-in page for /checkin route', () => {
    Object.defineProperty(window, 'location', {
      value: { pathname: '/checkin', search: '?token=abc123' },
      writable: true
    })
    
    render(<App />)
    expect(screen.getByText('Check In Page')).toBeInTheDocument()
  })

  it('shows organizer dashboard by default for organizer role', () => {
    mockGetUserRole.mockReturnValue('organizer')
    mockGetActiveRole.mockReturnValue('organizer')
    Object.defineProperty(window, 'location', {
      value: { pathname: '/', search: '' },
      writable: true
    })
    render(<App />)
    expect(screen.getByText('Dashboard Page')).toBeInTheDocument()
  })

  it('shows attendee dashboard for attendee role', () => {
    mockGetUserRole.mockReturnValue('attendee')
    mockGetActiveRole.mockReturnValue('attendee')
    Object.defineProperty(window, 'location', {
      value: { pathname: '/', search: '' },
      writable: true
    })
    render(<App />)
    expect(screen.getByText('Attendee Dashboard')).toBeInTheDocument()
  })
})