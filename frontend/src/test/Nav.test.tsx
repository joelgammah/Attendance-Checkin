import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import '@testing-library/jest-dom'

// Mock the router first (Nav likely uses routing)
vi.mock('../router', () => ({
  useParams: () => ({}),
  useNavigate: () => vi.fn(),
  Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>
}))

// Mock auth API
vi.mock('../api/auth', () => ({
  logout: vi.fn(),
  isAuthenticated: vi.fn(() => true),
  getUserRole: vi.fn(() => 'organizer')
}))

// Now import Nav after mocking its dependencies
import { logout } from '../api/auth'
import Nav from '../components/Nav'

const mockLogout = logout as any

describe('Nav Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders navigation links', () => {
    render(<Nav />)
    
    expect(screen.getByText('Terrier Check-In')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Create Event')).toBeInTheDocument()
  })

  it('calls logout when logout button is clicked', () => {
    render(<Nav />)
    
    const logoutButton = screen.getByText('Logout')
    fireEvent.click(logoutButton)
    
    expect(logout).toHaveBeenCalled()
  })
})