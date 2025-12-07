import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

// Mock the Protected Link module used by the component (path resolved from this test file)
vi.mock('../components/Protected', () => {
  return {
    Link: ({ to, children, ...rest }: any) => {
      return (
        <a href={to} {...rest}>
          {children}
        </a>
      )
    },
  }
})

// Import the component after the mock is in place (correct relative path)
import RecurringGroupCard from '../components/RecurringGroupCard'

describe('RecurringGroupCard', () => {
  it('renders details when next session exists', () => {
    const parent = { id: 'parent-1', name: 'Weekly Yoga' }
    const next = { start_time: '2025-12-01T10:00:00.000Z' }
    const group = {
      parent,
      next_session: next,
      total_past_sessions: 5,
      upcoming_sessions: [{ id: 1 }, { id: 2 }],
    }

    render(<RecurringGroupCard group={group as any} />)

    expect(screen.getByText(parent.name)).toBeInTheDocument()
    expect(screen.getByText('Recurring')).toBeInTheDocument()

    const expectedNextText = `Next session: ${new Date(next.start_time).toLocaleString()}`
    expect(screen.getByText(expectedNextText)).toBeInTheDocument()

    expect(screen.getByText('5 past • 2 upcoming')).toBeInTheDocument()

    const link = screen.getByRole('link', { name: /View Series/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', `/events/${parent.id}/family`)
  })

  it('renders fallback when no next session', () => {
    const parent = { id: 'parent-2', name: 'Meditation Group' }
    const group = {
      parent,
      next_session: null,
      total_past_sessions: 0,
      upcoming_sessions: [],
    }

    render(<RecurringGroupCard group={group as any} />)

    expect(screen.getByText('No upcoming sessions')).toBeInTheDocument()
    expect(screen.getByText('0 past • 0 upcoming')).toBeInTheDocument()

    const link = screen.getByRole('link', { name: /View Series/i })
    expect(link).toHaveAttribute('href', `/events/${parent.id}/family`)
  })
})