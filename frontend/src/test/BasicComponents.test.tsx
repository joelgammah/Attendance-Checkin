import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import '@testing-library/jest-dom'
import { Button, Spinner } from '../components/BasicComponents'

describe('BasicComponents', () => {
  describe('Button', () => {
    it('renders button with children text', () => {
      render(<Button>Click me</Button>)
      
      expect(screen.getByText('Click me')).toBeInTheDocument()
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('calls onClick when button is clicked', () => {
      const mockOnClick = vi.fn()
      render(<Button onClick={mockOnClick}>Click me</Button>)
      
      fireEvent.click(screen.getByText('Click me'))
      expect(mockOnClick).toHaveBeenCalledTimes(1)
    })

    it('renders primary variant by default', () => {
      render(<Button>Primary</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-blue-600', 'hover:bg-blue-700', 'text-white')
    })

    it('renders danger variant correctly', () => {
      render(<Button variant="danger">Delete</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-red-600', 'hover:bg-red-700', 'text-white')
    })

    it('renders success variant correctly', () => {
      render(<Button variant="success">Save</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-green-600', 'hover:bg-green-700', 'text-white')
    })

    it('renders warning variant correctly', () => {
      render(<Button variant="warning">Warning</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-yellow-500', 'hover:bg-yellow-600', 'text-white')
    })

    it('applies disabled styles when disabled', () => {
      render(<Button disabled>Disabled</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveClass('opacity-60', 'cursor-not-allowed')
    })

    it('does not call onClick when disabled', () => {
      const mockOnClick = vi.fn()
      render(<Button onClick={mockOnClick} disabled>Disabled</Button>)
      
      fireEvent.click(screen.getByText('Disabled'))
      expect(mockOnClick).not.toHaveBeenCalled()
    })

    it('has correct base classes', () => {
      render(<Button>Test</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass(
        'px-4', 'py-2', 'rounded', 'transition-colors', 'duration-200', 
        'font-medium', 'focus:outline-none', 'focus:ring-2', 
        'focus:ring-offset-2', 'focus:ring-blue-400'
      )
    })

    it('works without onClick prop', () => {
      render(<Button>No Click Handler</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      
      // Should not crash when clicked
      fireEvent.click(button)
    })

    it('handles complex children content', () => {
      render(
        <Button>
          <span>Icon</span>
          <span>Text</span>
        </Button>
      )
      
      expect(screen.getByText('Icon')).toBeInTheDocument()
      expect(screen.getByText('Text')).toBeInTheDocument()
    })

    it('applies correct variant styles for all variants', () => {
      const { rerender } = render(<Button variant="primary">Test</Button>)
      expect(screen.getByRole('button')).toHaveClass('bg-blue-600')

      rerender(<Button variant="danger">Test</Button>)
      expect(screen.getByRole('button')).toHaveClass('bg-red-600')

      rerender(<Button variant="success">Test</Button>)
      expect(screen.getByRole('button')).toHaveClass('bg-green-600')

      rerender(<Button variant="warning">Test</Button>)
      expect(screen.getByRole('button')).toHaveClass('bg-yellow-500')
    })

    it('combines disabled and variant classes correctly', () => {
      render(<Button variant="danger" disabled>Disabled Danger</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-red-600', 'opacity-60', 'cursor-not-allowed')
      expect(button).toBeDisabled()
    })

    it('handles multiple rapid clicks', () => {
      const mockOnClick = vi.fn()
      render(<Button onClick={mockOnClick}>Rapid Click</Button>)
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      fireEvent.click(button)
      fireEvent.click(button)
      
      expect(mockOnClick).toHaveBeenCalledTimes(3)
    })
  })

  describe('Spinner', () => {
    it('renders spinner component', () => {
      render(<Spinner />)
      
      const spinner = document.querySelector('.spinner')
      expect(spinner).toBeInTheDocument()
    })

    it('has correct size styles', () => {
      render(<Spinner />)
      
      const spinner = document.querySelector('.spinner')
      expect(spinner).toHaveStyle({ width: '24px', height: '24px' })
    })

    it('contains SVG element', () => {
      render(<Spinner />)
      
      const svg = document.querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveAttribute('viewBox', '0 0 50 50')
    })

    it('has correct SVG dimensions', () => {
      render(<Spinner />)
      
      const svg = document.querySelector('svg')
      expect(svg).toHaveStyle({ width: '24px', height: '24px' })
    })

    it('contains circle element with correct attributes', () => {
      render(<Spinner />)
      
      const circle = document.querySelector('circle')
      expect(circle).toBeInTheDocument()
      expect(circle).toHaveAttribute('cx', '25')
      expect(circle).toHaveAttribute('cy', '25')
      expect(circle).toHaveAttribute('r', '20')
      expect(circle).toHaveAttribute('fill', 'none')
      expect(circle).toHaveAttribute('stroke', '#3949ab')
      expect(circle).toHaveAttribute('stroke-width', '5')
    })

    it('has animation attributes', () => {
      render(<Spinner />)
      
      const animateTransform = document.querySelector('animateTransform')
      expect(animateTransform).toBeInTheDocument()
      expect(animateTransform).toHaveAttribute('attributeName', 'transform')
      expect(animateTransform).toHaveAttribute('type', 'rotate')
      expect(animateTransform).toHaveAttribute('dur', '1s')
      expect(animateTransform).toHaveAttribute('repeatCount', 'indefinite')
    })

    it('has correct stroke dash array', () => {
      render(<Spinner />)
      
      const circle = document.querySelector('circle')
      expect(circle).toHaveAttribute('stroke-dasharray', '31.415, 31.415')
    })

    it('has initial transform attribute', () => {
      render(<Spinner />)
      
      const circle = document.querySelector('circle')
      expect(circle).toHaveAttribute('transform', 'rotate(0 25 25)')
    })

    it('has correct animation keyframes', () => {
      render(<Spinner />)
      
      const animateTransform = document.querySelector('animateTransform')
      expect(animateTransform).toHaveAttribute('from', '0 25 25')
      expect(animateTransform).toHaveAttribute('to', '360 25 25')
    })

    it('renders as inline-block', () => {
      render(<Spinner />)
      
      const spinner = document.querySelector('.spinner')
      expect(spinner).toHaveStyle({ display: 'inline-block' })
    })

    it('maintains consistent structure', () => {
      render(<Spinner />)
      
      // Verify the nested structure: div > svg > circle > animateTransform
      const spinner = document.querySelector('.spinner')
      const svg = spinner?.querySelector('svg')
      const circle = svg?.querySelector('circle')
      const animateTransform = circle?.querySelector('animateTransform')
      
      expect(spinner).toBeInTheDocument()
      expect(svg).toBeInTheDocument()
      expect(circle).toBeInTheDocument()
      expect(animateTransform).toBeInTheDocument()
    })

    it('can be rendered multiple times', () => {
      render(
        <div>
          <Spinner />
          <Spinner />
          <Spinner />
        </div>
      )
      
      const spinners = document.querySelectorAll('.spinner')
      expect(spinners).toHaveLength(3)
    })
  })

  describe('Component Integration', () => {
    it('Button and Spinner can be used together', () => {
      render(
        <Button>
          <Spinner />
          Loading...
        </Button>
      )
      
      expect(screen.getByRole('button')).toBeInTheDocument()
      expect(document.querySelector('.spinner')).toBeInTheDocument()
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('multiple buttons with different variants work together', () => {
      render(
        <div>
          <Button variant="primary">Primary</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="success">Success</Button>
          <Button variant="warning">Warning</Button>
        </div>
      )
      
      expect(screen.getByText('Primary')).toHaveClass('bg-blue-600')
      expect(screen.getByText('Danger')).toHaveClass('bg-red-600')
      expect(screen.getByText('Success')).toHaveClass('bg-green-600')
      expect(screen.getByText('Warning')).toHaveClass('bg-yellow-500')
    })

    it('handles edge cases gracefully', () => {
      // Each button should be rendered separately to avoid conflicts
      const { unmount: unmount1 } = render(<Button>{""}</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
      unmount1()
      
      // Button with null children
      const { unmount: unmount2 } = render(<Button>{null}</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
      unmount2()
      
      // Button with undefined onClick
      const { unmount: unmount3 } = render(<Button onClick={undefined}>Undefined Click</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
      unmount3()
    })
  })
})