import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import '@testing-library/jest-dom'
import React from 'react'

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

// Mock history.pushState (Protected uses history.pushState for navigation)
const mockPushState = vi.fn()
Object.defineProperty(window, 'history', {
  value: { pushState: mockPushState },
  writable: true
})

// Mock window.addEventListener and removeEventListener
const mockAddEventListener = vi.fn()
const mockRemoveEventListener = vi.fn()
Object.defineProperty(window, 'addEventListener', {
  value: mockAddEventListener
})
Object.defineProperty(window, 'removeEventListener', {
  value: mockRemoveEventListener
})

// Mock Auth0 hook so tests can control isAuthenticated/isLoading
const mockUseAuth0 = { isAuthenticated: false, isLoading: false }
vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => mockUseAuth0
}))

import Protected, { useAuth, Link } from '../components/Protected'

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // reset Auth0 mock defaults
    mockUseAuth0.isAuthenticated = false
    mockUseAuth0.isLoading = false
  })

  it('returns true when token exists in localStorage', () => {
    mockLocalStorage.getItem.mockReturnValue('mock-token')
    
    function TestComponent() {
      const { authed } = useAuth()
      return <div>{authed ? 'authenticated' : 'not authenticated'}</div>
    }
    
    render(<TestComponent />)
    expect(screen.getByText('authenticated')).toBeInTheDocument()
  })

  it('returns false when no token in localStorage', () => {
    mockLocalStorage.getItem.mockReturnValue(null)
    
    function TestComponent() {
      const { authed } = useAuth()
      return <div>{authed ? 'authenticated' : 'not authenticated'}</div>
    }
    
    render(<TestComponent />)
    expect(screen.getByText('not authenticated')).toBeInTheDocument()
  })

  it('sets up storage event listener', () => {
    mockLocalStorage.getItem.mockReturnValue('token')
    
    function TestComponent() {
      useAuth()
      return <div>test</div>
    }
    
    render(<TestComponent />)
    
    // Should add event listener for storage
    expect(mockAddEventListener).toHaveBeenCalledWith('storage', expect.any(Function))
  })

  it('updates state when storage changes', async () => {
    // Ensure Auth0 mock is unauthenticated and not loading
    mockUseAuth0.isAuthenticated = false
    mockUseAuth0.isLoading = false

    mockLocalStorage.getItem.mockReturnValue(null)
    let storageHandler: Function
    
    mockAddEventListener.mockImplementation((event, handler) => {
      if (event === 'storage') {
        storageHandler = handler
      }
    })
    
    function TestComponent() {
      const authed = useAuth()
      return <div>{authed ? 'authenticated' : 'not authenticated'}</div>
    }
    
    render(<TestComponent />)

    // Simulate storage change
    mockLocalStorage.getItem.mockReturnValue('new-token')
    storageHandler!()

    await waitFor(() => {
      expect(screen.getByText('authenticated')).toBeInTheDocument()
    })
  })
})

describe('Link Component', () => {
  it('renders link with correct href', () => {
    render(<Link to="/dashboard">Dashboard</Link>)
    
    const link = screen.getByText('Dashboard')
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/dashboard')
    expect(link).toHaveClass('text-blue-600', 'hover:underline')
  })

  it('applies additional className', () => {
    render(<Link to="/test" className="extra-class">Test</Link>)
    
    const link = screen.getByText('Test')
    expect(link).toHaveClass('text-blue-600', 'hover:underline', 'extra-class')
  })

  it('passes through other props', () => {
    render(<Link to="/test" data-testid="test-link" title="Test Title">Test</Link>)
    
    const link = screen.getByTestId('test-link')
    expect(link).toHaveAttribute('title', 'Test Title')
    expect(link).toHaveAttribute('href', '/test')
  })
})

describe('Protected Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth0.isAuthenticated = false
    mockUseAuth0.isLoading = false
  })

  it('renders children when authenticated', () => {
    mockLocalStorage.getItem.mockReturnValue('mock-token')
    
    render(
      <Protected>
        <div>Protected Content</div>
      </Protected>
    )
    
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('redirects when not authenticated', () => {
    mockLocalStorage.getItem.mockReturnValue(null)
    
    render(
      <Protected>
        <div>Protected Content</div>
      </Protected>
    )
    
  // Should redirect to login via history.pushState
  expect(mockPushState).toHaveBeenCalledWith({}, '', '/login')
    
    // Should not render protected content
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('renders multiple children when authenticated', () => {
    mockLocalStorage.getItem.mockReturnValue('token')
    
    render(
      <Protected>
        <div>Content 1</div>
        <div>Content 2</div>
        <span>Content 3</span>
      </Protected>
    )
    
    expect(screen.getByText('Content 1')).toBeInTheDocument()
    expect(screen.getByText('Content 2')).toBeInTheDocument()
    expect(screen.getByText('Content 3')).toBeInTheDocument()
  })

  it('handles authentication state changes', async () => {
    // Start unauthenticated
    mockLocalStorage.getItem.mockReturnValue(null)
    let storageHandler: Function
    
    mockAddEventListener.mockImplementation((event, handler) => {
      if (event === 'storage') {
        storageHandler = handler
      }
    })
    
    const { rerender } = render(
      <Protected>
        <div>Protected Content</div>
      </Protected>
    )
    
  // Should redirect initially via history.pushState
  expect(mockPushState).toHaveBeenCalledWith({}, '', '/login')
    
    // Now authenticate
    mockLocalStorage.getItem.mockReturnValue('new-token')
    storageHandler!()
    
    // Re-render to trigger state update
    rerender(
      <Protected>
        <div>Protected Content</div>
      </Protected>
    )
    
    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })
  })

  it('cleans up event listener on unmount', () => {
    mockLocalStorage.getItem.mockReturnValue('token')
    
    const { unmount } = render(
      <Protected>
        <div>Protected Content</div>
      </Protected>
    )
    
    // Should add event listener
    expect(mockAddEventListener).toHaveBeenCalledWith('storage', expect.any(Function))
    
    unmount()
    
    // Should remove event listener
    expect(mockRemoveEventListener).toHaveBeenCalledWith('storage', expect.any(Function))
  })
})