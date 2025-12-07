import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import '@testing-library/jest-dom'

vi.mock('../api/auth', () => ({
  logout: vi.fn(),
  getUserRole: vi.fn(() => 'admin')
}))

vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    isAuthenticated: false,
    logout: vi.fn(),
    user: { email: 'testuser@example.com' }
  })
}))

vi.mock('../components/RoleSwitch', () => ({
  default: () => <div data-testid="role-switch">Role Switch</div>
}))

vi.mock('../components/Protected', () => ({
  Link: ({ to, className, children, ...props }: any) => (
    <a href={to} className={className} {...props} data-testid="dashboard-link">
      {children}
    </a>
  )
}))

import AdminNav from '../components/AdminNav'

describe('AdminNav', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(window, 'location', { value: { href: '' }, writable: true })
  })

  it('renders brand and logo', () => {
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

  it('renders role switch', () => {
    render(<AdminNav />)
    expect(screen.getByTestId('role-switch')).toBeInTheDocument()
  })

  it('calls onAddUser when Add User clicked', () => {
    const onAddUser = vi.fn()
    render(<AdminNav onAddUser={onAddUser} />)
    fireEvent.click(screen.getByText('Add User'))
    expect(onAddUser).toHaveBeenCalledTimes(1)
  })

  it('does not crash without onAddUser', () => {
    render(<AdminNav />)
    expect(() => fireEvent.click(screen.getByText('Add User'))).not.toThrow()
  })

  it('calls logout when Logout clicked', async () => {
    const { logout } = await import('../api/auth')
    render(<AdminNav />)
    fireEvent.click(screen.getByText('Logout'))
    expect(logout).toHaveBeenCalledTimes(1)
  })

  it('has correct button type for Add User', () => {
    render(<AdminNav />)
    const addUserButton = screen.getByText('Add User').closest('button')
    expect(addUserButton).toHaveAttribute('type', 'button')
  })

  it('renders SVG icons', () => {
    render(<AdminNav />)
    const svgIcons = document.querySelectorAll('svg')
    expect(svgIcons.length).toBeGreaterThanOrEqual(4)
  })

  it('renders divider and logo container', () => {
    render(<AdminNav />)
    expect(document.querySelector('.h-6.w-px.bg-gray-300')).toBeInTheDocument()
    expect(document.querySelector('.w-10.h-10.rounded-lg')).toBeInTheDocument()
  })

  it('handles rapid add-user clicks', () => {
    const onAddUser = vi.fn()
    render(<AdminNav onAddUser={onAddUser} />)
    const btn = screen.getByText('Add User')
    fireEvent.click(btn)
    fireEvent.click(btn)
    fireEvent.click(btn)
    expect(onAddUser).toHaveBeenCalledTimes(3)
  })
})