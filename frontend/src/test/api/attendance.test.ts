// Tests for attendance.ts API functions
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { getMyCheckIns, checkIn } from '../../api/attendance' 

// Mock the global fetch function
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock localStorage
const mockLocalStorage = {
    getItem: vi.fn((key) => {
        if (key === 'token') return 'mock-token'
        return null
    }),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
}

// Helper function to create mock responses
const createMockResponse = (data: any, status: number = 200) => {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: new Headers({
      'content-type': 'application/json',
    }),
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    clone: function() { return this },
    body: null,
    bodyUsed: false,
    redirected: false,
    type: 'basic' as ResponseType,
    url: '',    
  }
}

Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
})

describe('Attendance API functions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockFetch.mockClear()
    })

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