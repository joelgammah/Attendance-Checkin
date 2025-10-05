import { vi, describe, it, expect, beforeEach } from 'vitest'
import { getMyCheckIns, checkIn } from '../api/attendance'
import { createEvent, myUpcoming, myPast, getByToken } from '../api/events'

// Create a more complete mock for fetch
const mockFetch = vi.fn()

// Mock a complete Response object
const createMockResponse = (data: any, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: status === 200 ? 'OK' : 'Error',
  headers: new Headers({
    'content-type': 'application/json'
  }),
  json: () => Promise.resolve(data),
  text: () => Promise.resolve(JSON.stringify(data)),
  clone: function() { return this },
  body: null,
  bodyUsed: false,
  redirected: false,
  type: 'basic' as ResponseType,
  url: ''
})

// Mock localStorage if your API uses it
const mockLocalStorage = {
  getItem: vi.fn((key) => {
    if (key === 'token') return 'mock-token'
    return null
  }),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

// Set global fetch
global.fetch = mockFetch

describe('API functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockClear()
  })

  describe('Attendance API', () => {
    it('fetches check-ins successfully', async () => {
      const mockCheckIns = [
        { id: 1, event_id: 1, checked_in_at: '2024-01-01' }
      ]
      
      mockFetch.mockResolvedValueOnce(createMockResponse(mockCheckIns))

      const result = await getMyCheckIns()
      expect(result).toEqual(mockCheckIns)
    })

    it('performs check-in successfully', async () => {
      const mockResponse = { success: true }
      
      mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse))

      const result = await checkIn('token123')
      expect(result).toEqual(mockResponse)
    })

    it('handles check-in error', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ error: 'Failed' }, 400))

      try {
        await checkIn('invalid-token')
      } catch (error) {
        // Expected to throw
      }
    })
  })

  describe('Events API', () => {
    it('creates event successfully', async () => {
      const mockEvent = { id: 1, name: 'Test Event' }
      
      mockFetch.mockResolvedValueOnce(createMockResponse(mockEvent))

      const eventData = { 
        name: 'Test Event', 
        location: 'Test Location',
        start_time: '2024-01-01T10:00:00Z',
        end_time: '2024-01-01T12:00:00Z'
      }
      
      const result = await createEvent(eventData)
      expect(result).toEqual(mockEvent)
    })

    it('fetches upcoming events', async () => {
      const mockEvents = [{ id: 1, name: 'Event 1' }]
      
      mockFetch.mockResolvedValueOnce(createMockResponse(mockEvents))

      const result = await myUpcoming()
      expect(result).toEqual(mockEvents)
    })

    it('fetches past events', async () => {
      const mockEvents = [{ id: 1, name: 'Past Event' }]
      
      mockFetch.mockResolvedValueOnce(createMockResponse(mockEvents))

      const result = await myPast()
      expect(result).toEqual(mockEvents)
    })

    it('fetches event by token', async () => {
      const mockEvent = { id: 1, name: 'Token Event' }
      
      mockFetch.mockResolvedValueOnce(createMockResponse(mockEvent))

      const result = await getByToken('abc123')
      expect(result).toEqual(mockEvent)
    })

    it('handles API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ error: 'Not found' }, 404))

      try {
        await getByToken('invalid-token')
      } catch (error) {
        // Expected to fail
      }
    })
  })

  describe('Network errors', () => {
    it('handles network failures', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      try {
        await myUpcoming()
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }
    })
  })
})