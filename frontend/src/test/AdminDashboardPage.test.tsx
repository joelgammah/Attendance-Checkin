import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import '@testing-library/jest-dom'
import AdminDashboardPage from '../pages/AdminDashboardPage'

// Mock dependencies
vi.mock('../components/AdminNav', () => ({
  default: ({ onAddUser }: any) => (
    <div data-testid="admin-nav" onClick={onAddUser}>AdminNav</div>
  )
}))
vi.mock('../components/AddUserModal', () => ({
  default: ({ onClose, onSuccess, loading, error }: any) => (
    <div data-testid="add-user-modal">
      AddUserModal
      <button onClick={onClose}>Close</button>
      <button onClick={() => onSuccess({ name: 'Test', email: 'test@x.com', password: 'pw', roles: ['attendee'] })}>Add</button>
      {loading && <span>Loading...</span>}
      {error && <span>{error}</span>}
    </div>
  )
}))

const mockGetActiveRole = vi.fn(() => 'admin')
const mockLogout = vi.fn()
const mockGetAllUsers = vi.fn()
const mockPromoteUser = vi.fn()
const mockRevokeOrganizer = vi.fn()
const mockDeleteUser = vi.fn()
const mockCreateUser = vi.fn()
const mockGetAllEvents = vi.fn()
const mockDeleteEvent = vi.fn()
const mockDownloadAttendanceCsv = vi.fn()
const mockGetAuditLogs = vi.fn()

vi.mock('../api/auth', () => ({
  getActiveRole: () => mockGetActiveRole(),
  logout: () => mockLogout(),
}))
vi.mock('../api/users', () => ({
  getAllUsers: (...args: any[]) => mockGetAllUsers(...args),
  promoteUser: (...args: any[]) => mockPromoteUser(...args),
  revokeOrganizer: (...args: any[]) => mockRevokeOrganizer(...args),
  deleteUser: (...args: any[]) => mockDeleteUser(...args),
  createUser: (...args: any[]) => mockCreateUser(...args),
}))
vi.mock('../api/events', () => ({
  getAllEvents: (...args: any[]) => mockGetAllEvents(...args),
  deleteEvent: (...args: any[]) => mockDeleteEvent(...args),
  downloadAttendanceCsv: (...args: any[]) => mockDownloadAttendanceCsv(...args),
  getEventAttendees: vi.fn(),
}))
vi.mock('../api/logs', () => ({
  getAuditLogs: (...args: any[]) => mockGetAuditLogs(...args),
}))

describe('AdminDashboardPage', () => {
  it('shows and interacts with confirmation modal for delete user', async () => {
    render(<AdminDashboardPage />)
    await waitFor(() => expect(screen.getByText('Users')).toBeInTheDocument())
    // Click the delete button for the first user
    fireEvent.click(screen.getAllByText('Delete')[0])
    // Modal should appear with correct text
    expect(screen.getByText(/permanently delete the user/i)).toBeInTheDocument()
    // Click cancel
    fireEvent.click(screen.getByText('Cancel'))
    expect(screen.queryByText(/permanently delete the user/i)).not.toBeInTheDocument()
  })

  it('shows and interacts with confirmation modal for delete event', async () => {
    render(<AdminDashboardPage />)
    await waitFor(() => expect(screen.getByText('Events')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Events'))
    await waitFor(() => expect(screen.getByText('Delete')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Delete'))
    expect(screen.getByText(/permanently delete the event/i)).toBeInTheDocument()
    fireEvent.click(screen.getByText('Cancel'))
    expect(screen.queryByText(/permanently delete the event/i)).not.toBeInTheDocument()
  })

  it('shows and interacts with confirmation modal for promote', async () => {
    render(<AdminDashboardPage />)
    await waitFor(() => expect(screen.getByText('Users')).toBeInTheDocument())
    // Find the promote button (for a user who is not an organizer)
    fireEvent.click(screen.getByText('Promote to Organizer'))
    expect(screen.getByText(/Promote user/i)).toBeInTheDocument()
    fireEvent.click(screen.getByText('Cancel'))
    expect(screen.queryByText(/Promote user/i)).not.toBeInTheDocument()
  })

  it('shows and interacts with confirmation modal for revoke', async () => {
    render(<AdminDashboardPage />)
    await waitFor(() => expect(screen.getByText('Users')).toBeInTheDocument())
    // Find the revoke button (for a user who is an organizer)
    fireEvent.click(screen.getByText('Revoke Organizer'))
    expect(screen.getByText(/Revoke Organizer status/i)).toBeInTheDocument()
    fireEvent.click(screen.getByText('Cancel'))
    expect(screen.queryByText(/Revoke Organizer status/i)).not.toBeInTheDocument()
  })
  it('shows and closes success notification toast', async () => {
    render(<AdminDashboardPage />)
    await waitFor(() => expect(screen.getByText('Users')).toBeInTheDocument())
    // Simulate a successful action that triggers the notification
    // We'll call the AddUserModal's onSuccess prop via the modal
    fireEvent.click(screen.getByTestId('admin-nav'))
    await waitFor(() => expect(screen.getByTestId('add-user-modal')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Add'))
    // Wait for notification to appear
    await waitFor(() => expect(screen.getByText('User added!')).toBeInTheDocument())
    // Close the notification
    fireEvent.click(screen.getByLabelText('Close notification'))
    expect(screen.queryByText('User added!')).not.toBeInTheDocument()
  })
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetActiveRole.mockReturnValue('admin')
    mockGetAllUsers.mockResolvedValue([
      { id: 1, name: 'Alice', email: 'alice@x.com', roles: ['attendee'] },
      { id: 2, name: 'Bob', email: 'bob@x.com', roles: ['organizer'] },
    ])
    mockGetAllEvents.mockResolvedValue([
      { id: 1, name: 'Event 1', organizer_name: 'Alice', start_time: new Date().toISOString(), end_time: new Date().toISOString(), location: 'Room 1', attendance_count: 5 },
    ])
    mockGetAuditLogs.mockResolvedValue([
      { id: 1, timestamp: '2025-01-01', user_email: 'alice@x.com', action: 'login', details: 'Success' },
    ])
    mockCreateUser.mockImplementation((form) => Promise.resolve({
      id: 3,
      name: form.name,
      email: form.email,
      roles: form.roles || ['attendee']
    }))
  })

  it('renders loading state', () => {
    render(<AdminDashboardPage />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders users tab', async () => {
    render(<AdminDashboardPage />)
    await waitFor(() => expect(screen.getByText('Users')).toBeInTheDocument())
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('bob@x.com')).toBeInTheDocument()
  })

  it('renders events tab', async () => {
    render(<AdminDashboardPage />)
    // Wait for loading to finish and "Events" tab to appear
    await waitFor(() => expect(screen.getByText('Events')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Events'))
    await waitFor(() => expect(screen.getByText('Event 1')).toBeInTheDocument())
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('renders logs tab', async () => {
    render(<AdminDashboardPage />)
    await waitFor(() => expect(screen.getByText('Audit Logs')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Audit Logs'))
    await waitFor(() => expect(screen.getByText('login')).toBeInTheDocument())
    expect(screen.getByText('Success')).toBeInTheDocument()
  })

  it('shows forbidden for non-admin', () => {
    mockGetActiveRole.mockReturnValue('attendee')
    render(<AdminDashboardPage />)
    expect(screen.getByText('Forbidden')).toBeInTheDocument()
    expect(screen.getByText('You do not have permission to view this page.')).toBeInTheDocument()
  })

  it('shows add user modal', async () => {
    render(<AdminDashboardPage />)
    await waitFor(() => expect(screen.getByTestId('admin-nav')).toBeInTheDocument())
    fireEvent.click(screen.getByTestId('admin-nav'))
    await waitFor(() => expect(screen.getByTestId('add-user-modal')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Close'))
    expect(screen.queryByTestId('add-user-modal')).not.toBeInTheDocument()
  })
})
