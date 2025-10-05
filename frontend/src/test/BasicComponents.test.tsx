import { render } from '@testing-library/react'
import { vi } from 'vitest'
import '@testing-library/jest-dom'

// Mock router (pages likely use routing)
vi.mock('../router', () => ({
  useParams: () => ({}),
  useNavigate: () => vi.fn(),
  Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>
}))

// Mock Nav component (pages likely import Nav)
vi.mock('../components/Nav', () => ({
  default: () => <div>Nav Component</div>
}))

// Mock Protected component (pages might use it)
vi.mock('../components/Protected', () => ({
  default: ({ children }: any) => <div>{children}</div>,
  Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>
}))

// Mock all API dependencies
vi.mock('../api/auth', () => ({
  isAuthenticated: () => true,
  getUserRole: () => 'organizer',
  logout: vi.fn()
}))

vi.mock('../api/events', () => ({
  myUpcoming: () => Promise.resolve([]),
  myPast: () => Promise.resolve([]),
  createEvent: vi.fn(),
  getByToken: vi.fn()
}))

vi.mock('../api/attendance', () => ({
  getMyCheckIns: () => Promise.resolve([]),
  checkIn: vi.fn()
}))

// Mock client utilities
vi.mock('../api/client', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn()
}))

describe('Basic component rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders DashboardPage', async () => {
    const DashboardPage = (await import('../pages/DashboardPage')).default
    render(<DashboardPage />)
  })

  it('renders AttendeeDashboard', async () => {
    const AttendeeDashboard = (await import('../pages/AttendeeDashboard')).default
    render(<AttendeeDashboard />)
  })

  it('renders EventFormPage', async () => {
    const EventFormPage = (await import('../pages/EventFormPage')).default
    render(<EventFormPage />)
  })
})