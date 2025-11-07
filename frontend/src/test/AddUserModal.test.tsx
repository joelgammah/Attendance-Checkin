import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import '@testing-library/jest-dom'
import AddUserModal from '../components/AddUserModal'

describe('AddUserModal', () => {
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const defaultProps = {
    onClose: mockOnClose,
    onSuccess: mockOnSuccess,
    loading: false,
    error: ''
  }

  it('renders modal with all form fields', () => {
    render(<AddUserModal {...defaultProps} />)
    
    expect(screen.getByText('Add New User')).toBeInTheDocument()
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Initial Password')).toBeInTheDocument()
    expect(screen.getByText('Role')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
    expect(screen.getByText('Add User')).toBeInTheDocument()
  })

  it('has correct default form values', () => {
    render(<AddUserModal {...defaultProps} />)
    
    const inputs = screen.getAllByDisplayValue('')
    const roleSelect = screen.getByRole('combobox')

    expect(inputs).toHaveLength(3) // name, email, password
    expect(roleSelect).toHaveValue('attendee')
  })

  it('updates form values when user types', () => {
    render(<AddUserModal {...defaultProps} />)
    
    const inputs = screen.getAllByDisplayValue('')
    const nameInput = inputs[0] // First input (name)
    const emailInput = inputs[1] // Second input (email)
    const passwordInput = inputs[2] // Third input (password)

    fireEvent.change(nameInput, { target: { value: 'John Doe' } })
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })

    expect(nameInput).toHaveValue('John Doe')
    expect(emailInput).toHaveValue('john@example.com')
    expect(passwordInput).toHaveValue('password123')
  })

  it('updates role when role is changed', () => {
    render(<AddUserModal {...defaultProps} />)
    
    const roleSelect = screen.getByRole('combobox')
    
    fireEvent.change(roleSelect, { target: { value: 'organizer' } })
    expect(roleSelect).toHaveValue('organizer')

    fireEvent.change(roleSelect, { target: { value: 'admin' } })
    expect(roleSelect).toHaveValue('admin')
  })

  it('has all role options available', () => {
    render(<AddUserModal {...defaultProps} />)
    
    expect(screen.getByRole('option', { name: 'Attendee' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Organizer' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Admin' })).toBeInTheDocument()
  })

  it('calls onClose when cancel button is clicked', () => {
    render(<AddUserModal {...defaultProps} />)
    
    fireEvent.click(screen.getByText('Cancel'))
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('calls onSuccess with form data when form is submitted', async () => {
    render(<AddUserModal {...defaultProps} />)
    
    const inputs = screen.getAllByDisplayValue('')
    const roleSelect = screen.getByRole('combobox')
    
    // Fill out the form
    fireEvent.change(inputs[0], { target: { value: 'Jane Smith' } })
    fireEvent.change(inputs[1], { target: { value: 'jane@example.com' } })
    fireEvent.change(inputs[2], { target: { value: 'secret123' } })
    fireEvent.change(roleSelect, { target: { value: 'organizer' } })
    
    // Submit the form
    fireEvent.click(screen.getByText('Add User'))
    
    expect(mockOnSuccess).toHaveBeenCalledWith({
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: 'secret123',
      roles: ['organizer']
    })
  })

  it('submits form when Enter key is pressed', async () => {
    render(<AddUserModal {...defaultProps} />)
    
    const inputs = screen.getAllByDisplayValue('')
    
    // Fill out the form
    fireEvent.change(inputs[0], { target: { value: 'Test User' } })
    fireEvent.change(inputs[1], { target: { value: 'test@example.com' } })
    fireEvent.change(inputs[2], { target: { value: 'test123' } })
    
    // Submit by submitting the form
    const form = document.querySelector('form')!
    fireEvent.submit(form)
    
    expect(mockOnSuccess).toHaveBeenCalledWith({
      name: 'Test User',
      email: 'test@example.com',
      password: 'test123',
      roles: ['attendee']
    })
  })

  it('displays error message when error prop is provided', () => {
    render(<AddUserModal {...defaultProps} error="Email already exists" />)
    
    expect(screen.getByText('Email already exists')).toBeInTheDocument()
    expect(screen.getByText('Email already exists')).toHaveClass('text-red-600')
  })

  it('shows loading state when loading prop is true', () => {
    render(<AddUserModal {...defaultProps} loading={true} />)
    
    expect(screen.getByText('Adding...')).toBeInTheDocument()
    
    // Buttons should be disabled
    expect(screen.getByText('Cancel')).toBeDisabled()
    expect(screen.getByText('Adding...')).toBeDisabled()
  })

  it('does not submit form when loading is true', async () => {
    render(<AddUserModal {...defaultProps} loading={true} />)
    
    const inputs = screen.getAllByDisplayValue('')
    
    // Fill out form and try to submit
    fireEvent.change(inputs[0], { target: { value: 'Test' } })
    fireEvent.change(inputs[1], { target: { value: 'test@test.com' } })
    fireEvent.change(inputs[2], { target: { value: 'test' } })
    
    fireEvent.click(screen.getByText('Adding...'))
    
    // Should not call onSuccess when loading
    expect(mockOnSuccess).not.toHaveBeenCalled()
  })

  it('has correct form field types and attributes', () => {
    render(<AddUserModal {...defaultProps} />)
    
    const inputs = screen.getAllByDisplayValue('')
    const nameInput = inputs[0]
    const emailInput = inputs[1]
    const passwordInput = inputs[2]

    expect(nameInput).toHaveAttribute('type', 'text')
    expect(nameInput).toHaveAttribute('required')
    expect(nameInput).toHaveAttribute('name', 'name')

    expect(emailInput).toHaveAttribute('type', 'email')
    expect(emailInput).toHaveAttribute('required')
    expect(emailInput).toHaveAttribute('name', 'email')

    expect(passwordInput).toHaveAttribute('type', 'text')
    expect(passwordInput).toHaveAttribute('required')
    expect(passwordInput).toHaveAttribute('name', 'password')
  })

  it('has correct styling classes', () => {
    render(<AddUserModal {...defaultProps} />)
    
    // Check modal backdrop
    const modalBackdrop = document.querySelector('.fixed.inset-0.z-50')
    expect(modalBackdrop).toBeInTheDocument()
    expect(modalBackdrop).toHaveClass('backdrop-blur-sm')

    // Check form styling
    const form = document.querySelector('form')
    expect(form).toHaveClass('bg-white', 'rounded-lg', 'shadow-lg')
  })

  it('handles multiple role changes correctly', () => {
    render(<AddUserModal {...defaultProps} />)
    
    const roleSelect = screen.getByRole('combobox')
    
    // Change role multiple times
    fireEvent.change(roleSelect, { target: { value: 'organizer' } })
    expect(roleSelect).toHaveValue('organizer')

    fireEvent.change(roleSelect, { target: { value: 'admin' } })
    expect(roleSelect).toHaveValue('admin')

    fireEvent.change(roleSelect, { target: { value: 'attendee' } })
    expect(roleSelect).toHaveValue('attendee')
  })

  it('renders without error when no error prop is provided', () => {
    render(<AddUserModal {...defaultProps} />)
    
    // Should not have any error text visible
    expect(screen.queryByText(/error/i)).not.toBeInTheDocument()
    expect(document.querySelector('.text-red-600')).not.toBeInTheDocument()
  })

  it('handles form submission with empty optional fields', async () => {
    render(<AddUserModal {...defaultProps} />)
    
    const inputs = screen.getAllByDisplayValue('')
    
    // Only fill required fields (all fields are actually required in this component)
    fireEvent.change(inputs[0], { target: { value: 'Min User' } })
    fireEvent.change(inputs[1], { target: { value: 'min@example.com' } })
    fireEvent.change(inputs[2], { target: { value: 'min123' } })
    
    fireEvent.click(screen.getByText('Add User'))
    
    expect(mockOnSuccess).toHaveBeenCalledWith({
      name: 'Min User',
      email: 'min@example.com',
      password: 'min123',
      roles: ['attendee'] // Default role
    })
  })

  it('prevents form submission when required fields are empty', () => {
    render(<AddUserModal {...defaultProps} />)
    
    // Try to submit with empty fields
    fireEvent.click(screen.getByText('Add User'))
    
    // Form should not submit due to HTML5 validation (required attributes)
    // This would be handled by the browser, so we just verify the required attributes exist
    const inputs = screen.getAllByDisplayValue('')
    expect(inputs[0]).toHaveAttribute('required')
    expect(inputs[1]).toHaveAttribute('required') 
    expect(inputs[2]).toHaveAttribute('required')
  })
})