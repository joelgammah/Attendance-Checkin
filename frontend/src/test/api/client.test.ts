// Tests for client.ts API functions
import { vi, describe, it, expect, beforeEach } from 'vitest'
import {fetchJson} from '../../api/client'

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

describe('Client API functions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockFetch.mockClear()
    })

    it('fetches client info successfully', async () => {
        const mockClientInfo = { id: 1, name: 'Test Client' }
        mockFetch.mockResolvedValueOnce(createMockResponse(mockClientInfo))

        const result = await fetchJson('/client/info')
        expect(result).toEqual(mockClientInfo)
    })
})
