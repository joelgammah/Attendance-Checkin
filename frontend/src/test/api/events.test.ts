// Tests for events.ts API functions
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { createEvent, myUpcoming, myPast, getAllEvents, getByToken, csvUrl, downloadAttendanceCsv, getEvent, getEventAttendees, deleteEvent } from '../../api/events'

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
    blob: () => Promise.resolve(data),
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

describe('Events API functions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockFetch.mockClear()
    })

    it('creates an event successfully', async () => {
        const mockEvent = { id: 1, name: 'Test Event' }
        mockFetch.mockResolvedValueOnce(createMockResponse(mockEvent))

        const result = await createEvent(mockEvent)
        expect(result).toEqual(mockEvent)
    })

    it('fetches upcoming events successfully', async () => {
        const mockEvents = [
            { id: 1, name: 'Upcoming Event 1' },
            { id: 2, name: 'Upcoming Event 2' },
        ]
        mockFetch.mockResolvedValueOnce(createMockResponse(mockEvents))

        const result = await myUpcoming()
        expect(result).toEqual(mockEvents)
    })

    it('fetches past events successfully', async () => {
        const mockEvents = [
            { id: 1, name: 'Past Event 1' },
            { id: 2, name: 'Past Event 2' },
        ]
        mockFetch.mockResolvedValueOnce(createMockResponse(mockEvents))

        const result = await myPast()
        expect(result).toEqual(mockEvents)
    })

    it('fetches all events successfully', async () => {
        const mockEvents = [
            { id: 1, name: 'Event 1' },
            { id: 2, name: 'Event 2' },
            { id: 3, name: 'Event 3' },
        ]
        mockFetch.mockResolvedValueOnce(createMockResponse(mockEvents))

        const result = await getAllEvents()
        expect(result).toEqual(mockEvents)
    })

    it('fetches event by token successfully', async () => {
        const mockEvent = { id: 1, name: 'Event by Token' }
        mockFetch.mockResolvedValueOnce(createMockResponse(mockEvent))

        const result = await getByToken('mock-token')
        expect(result).toEqual(mockEvent)
    })

    it('fetches attendance CSV URL correctly', () => {
        const eventId = 123
        const expectedUrl = `${import.meta.env.VITE_API_URL || '/api'}/v1/events/${eventId}/attendance.csv`
        const url = csvUrl(eventId)
        expect(url).toBe(expectedUrl)
    })

    it('fetches attendance CSV download successfully', async () => {
        const eventId = 123
        const eventName = 'Sample Event'
        const mockBlob = new Blob(['Name, Location, Att. ID, Date/Time Checked In\nJohn Doe, Room 101, 1, 2025-01-01 10:00:00'], { type: 'text/csv' })
        mockFetch.mockResolvedValueOnce(createMockResponse(mockBlob, 200))


        // Ensure URL.createObjectURL exists in the test environment
        if (!('createObjectURL' in URL)) {
            // @ts-ignore
            URL.createObjectURL = () => 'blob:http://localhost/fake'
        }
        // Ensure URL.revokeObjectURL exists in the test environment
        if (!('revokeObjectURL' in URL)) {
            // @ts-ignore
            URL.revokeObjectURL = () => {}
        }
        const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:http://localhost/fake')
        const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
        const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node)
        const removeSpy = vi.fn()
        vi.spyOn(document, 'createElement').mockReturnValue({
                href: '',
                download: '',
                click: () => {},
                remove: removeSpy,
        } as any)

        const result = await downloadAttendanceCsv(eventId, eventName)
        expect(result).toBeUndefined()
    })

    it('handles attendance CSV download error', async () => {
        const eventId = 123
        mockFetch.mockResolvedValueOnce(createMockResponse({ error: 'Not Found' }, 404))

        try {
            await downloadAttendanceCsv(eventId, 'Sample Event')
        } catch (error) {
            expect((error as Error).message).toBe('HTTP 404')
        }
    })

    it('fetches event details successfully', async () => {
        const mockEvent = { id: 1, name: 'Event Details' }
        mockFetch.mockResolvedValueOnce(createMockResponse(mockEvent))

        const result = await getEvent(1)
        expect(result).toEqual(mockEvent)
    })

    it('fetches event attendees successfully', async () => {
        const mockAttendees = [
            { id: 1, attendee_id: 101, attendee_name: 'John Doe', attendee_email: 'john@example.com' },
            { id: 2, attendee_id: 102, attendee_name: 'Jane Smith', attendee_email: 'jane@example.com' },
        ]
        mockFetch.mockResolvedValueOnce(createMockResponse(mockAttendees))

        const result = await getEventAttendees(1)
        expect(result).toEqual(mockAttendees)
    })
    
    it('deletes an event successfully', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({}, 204))

        const result = await deleteEvent(1)
        expect(result).toBeUndefined()
    })  

})