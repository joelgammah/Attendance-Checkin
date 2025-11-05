// Tests for auth.ts API functions
import { vi, describe, it, expect, beforeEach } from 'vitest'
import {login, logout, getUserRole, getUserRoles, getActiveRole, setActiveRole} from '../../api/auth'

// Create a more complete mock for fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock localStorage
const mockLocalStorage = {
    getItem: vi.fn((key) => {
        if (key === 'token') return 'mock-token'
        if (key === 'active_role') return 'admin'
        if (key === 'roles') return JSON.stringify(['user', 'admin'])
        return null
    }),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
})      

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

describe('Auth API functions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockFetch.mockClear()
    })

    describe('login', () => {
        it('logs in successfully and stores data in localStorage', async () => {
            const mockResponse = {
                access_token: 'mock-access-token',
                token_type: 'Bearer',
                role: 'user',
                roles: ['user', 'admin'],
                primary_role: 'admin'
            }
            mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse))

            const result = await login('user', 'password')

            expect(result).toEqual(mockResponse)
            expect(localStorage.setItem).toHaveBeenCalledWith('token', mockResponse.access_token)
            expect(localStorage.setItem).toHaveBeenCalledWith('active_role', mockResponse.primary_role)
        })
    }) 
    
    describe('logout', () => {
        it('clears localStorage on logout', () => {
            logout()
            expect(localStorage.removeItem).toHaveBeenCalledWith('token')
            expect(localStorage.removeItem).toHaveBeenCalledWith('active_role')
        })
    })
    
    describe('getUserRole', () => {
        it('retrieves the user role from localStorage', () => {
            const role = getUserRole()
            expect(role).toBe('admin')
            expect(localStorage.getItem).toHaveBeenCalledWith('active_role')
        })
    })

    describe('getUserRoles', () => {
        it('retrieves user roles from localStorage', () => {
            const rolesJson = JSON.stringify(['user', 'admin'])

            const roles = getUserRoles()
            expect(roles).toEqual(['user', 'admin'])
            expect(localStorage.getItem).toHaveBeenCalledWith('roles')
        })
    })

    describe('getActiveRole', () => {
        it('retrieves the active role from localStorage', () => {
            const activeRole = getActiveRole()
            expect(activeRole).toBe('admin')
            expect(localStorage.getItem).toHaveBeenCalledWith('active_role')
        })
    })

    describe('setActiveRole', () => {
        it('sets the active role in localStorage', () => {
            setActiveRole('attendee')
            expect(localStorage.setItem).toHaveBeenCalledWith('active_role', 'attendee')
        })
    })
})