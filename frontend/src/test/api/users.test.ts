// Tests for users.ts API functions
import { vi, describe, it, expect, beforeEach } from 'vitest'
import {getAllUsers, promoteUser, revokeOrganizer, deleteUser, createUser} from '../../api/users'

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

describe('Users API functions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockFetch.mockClear()
    })

    it('fetches all users successfully', async () => {
        const mockUsers = [{ id: 1, email: 'test@example.com', name: 'Test User' }]
        mockFetch.mockResolvedValueOnce(createMockResponse(mockUsers))

        const result = await getAllUsers()
        expect(result).toEqual(mockUsers)
    })

    it('promotes a user successfully', async () => {
        const mockUser = { id: 1, email: 'test@example.com', name: 'Test User', role: 'user' }
        mockFetch.mockResolvedValueOnce(createMockResponse(mockUser))

        const result = await promoteUser(mockUser.id)
        expect(result).toEqual(mockUser)
    })

    it('revokes organizer role from a user successfully', async () => {
        const mockUser = { id: 1, email: 'test@example.com', name: 'Test User', role: 'organizer' }
        mockFetch.mockResolvedValueOnce(createMockResponse(mockUser))

        const result = await revokeOrganizer(mockUser.id)
        expect(result).toEqual(mockUser)
    })

    it('deletes a user successfully', async () => {
        const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' }
        mockFetch.mockResolvedValueOnce(createMockResponse(mockUser))

        const result = await deleteUser(mockUser.id)
        expect(result).toEqual(mockUser)
    })

    it('creates a user successfully', async () => {
        const mockUser = { name: 'New User', email: 'newuser@example.com', password: 'password123', roles: ['user'] }
        mockFetch.mockResolvedValueOnce(createMockResponse(mockUser))

        const result = await createUser(mockUser)
        expect(result).toEqual(mockUser)
    })
})
