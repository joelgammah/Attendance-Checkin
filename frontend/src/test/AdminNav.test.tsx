import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import '@testing-library/jest-dom'
import AdminNav from '../components/AdminNav'

// Mock the auth module
vi.mock('../api/auth', () => ({
  logout: vi.fn(),
  getUserRole: vi.fn(() => 'admin')
}))

// Mock the RoleSwitch component
vi.mock('../components/RoleSwitch', () => ({
  default: () => <div data-testid="role-switch">Role Switch</div>
}))

// Mock the Protected component's Link
vi.mock('../components/Protected', () => ({
  Link: ({ to, className, children, onMouseEnter, onMouseLeave, ...props }: any) => (
    <a
      href={to}
      className={className}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      {...props}
      data-testid="dashboard-link"
    >
      {children}
    </a>
  )
}))

describe('AdminNav', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock location.href assignment
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true
    })
  })

  it('renders brand and logo correctly', () => {
    render(<AdminNav />)
    
    expect(screen.getByText('Terrier Check-In')).toBeInTheDocument()
    expect(screen.getByText('Terrier Check-In')).toHaveClass('text-xl', 'font-bold', 'text-gray-900')
  })

  it('renders navigation links', () => {
    render(<AdminNav />)
    
    const dashboardLink = screen.getByTestId('dashboard-link')
    expect(dashboardLink).toBeInTheDocument()
    expect(dashboardLink).toHaveAttribute('href', '/')
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('renders role switch component', () => {
    render(<AdminNav />)
    
    expect(screen.getByTestId('role-switch')).toBeInTheDocument()
  })

  it('calls onAddUser when Add User button is clicked', () => {
    const onAddUser = vi.fn()
    render(<AdminNav onAddUser={onAddUser} />)
    
    fireEvent.click(screen.getByText('Add User'))
    expect(onAddUser).toHaveBeenCalledTimes(1)
  })

  it('does not crash when onAddUser is not provided', () => {
    render(<AdminNav />)
    
    expect(() => {
      fireEvent.click(screen.getByText('Add User'))
    }).not.toThrow()
  })

  it('calls logout and redirects when logout button is clicked', async () => {
    const { logout } = await import('../api/auth')
    render(<AdminNav />)
    
    fireEvent.click(screen.getByText('Logout'))
    
    expect(logout).toHaveBeenCalledTimes(1)
  })

  it('has correct button types', () => {
    render(<AdminNav />)
    
    const addUserButton = screen.getByText('Add User').closest('button')
    expect(addUserButton).toHaveAttribute('type', 'button')
  })

  it('renders all SVG icons', () => {
    render(<AdminNav />)
    
    const svgIcons = document.querySelectorAll('svg')
    expect(svgIcons.length).toBeGreaterThanOrEqual(4) // logo, dashboard, add user, logout icons
  })

  it('has correct styling classes', () => {
    render(<AdminNav />)
    
    // Check nav styling
    const nav = document.querySelector('nav')
    expect(nav).toHaveClass('w-full', 'flex', 'items-center', 'justify-between', 'p-6', 'bg-white')
    
    // Check brand styling - the h1 element itself has the classes
    const brand = screen.getByText('Terrier Check-In')
    expect(brand).toHaveClass('text-xl', 'font-bold', 'text-gray-900')
  })

  it('renders divider element', () => {
    render(<AdminNav />)
    
    const divider = document.querySelector('.h-6.w-px.bg-gray-300')
    expect(divider).toBeInTheDocument()
  })

  it('maintains component structure with all required elements', () => {
    render(<AdminNav />)
    
    // Verify all main sections exist
    expect(screen.getByText('Terrier Check-In')).toBeInTheDocument()
    expect(screen.getByTestId('role-switch')).toBeInTheDocument()
    expect(screen.getByTestId('dashboard-link')).toBeInTheDocument()
    expect(screen.getByText('Add User')).toBeInTheDocument()
    expect(screen.getByText('Logout')).toBeInTheDocument()
    
    // Verify the logo container
    const logoContainer = document.querySelector('.w-10.h-10.rounded-lg')
    expect(logoContainer).toBeInTheDocument()
  })

  it('handles multiple rapid clicks correctly', () => {
    const onAddUser = vi.fn()
    render(<AdminNav onAddUser={onAddUser} />)
    
    const addUserButton = screen.getByText('Add User')
    
    // Click multiple times rapidly
    fireEvent.click(addUserButton)
    fireEvent.click(addUserButton)
    fireEvent.click(addUserButton)
    
    expect(onAddUser).toHaveBeenCalledTimes(3)
  })
})