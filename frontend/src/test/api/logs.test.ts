// Tests for logs.ts API functions
import { vi, describe, it, expect, beforeEach } from 'vitest'
import {getAuditLogs} from '../../api/logs'

// Mock the global fetch function
const mockFetch = vi.fn()
global.fetch = mockFetch

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

describe('Logs API functions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockFetch.mockClear()
    })

    it('fetches audit logs successfully', async () => {
        const mockLogs = [{ id: 1, action: 'login', user_email: 'test@example.com', timestamp: '2023-01-01T00:00:00Z' }]
        mockFetch.mockResolvedValueOnce(createMockResponse(mockLogs))

        const result = await getAuditLogs()
        expect(result).toEqual(mockLogs)
    })
})
