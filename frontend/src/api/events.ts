import { fetchJson } from './client'
import type { EventOut } from '../types'

export async function createEvent(payload: any): Promise<EventOut> {
  return fetchJson<EventOut>(`/v1/events/`, { method: 'POST', body: JSON.stringify(payload) })
}
export async function myUpcoming(): Promise<EventOut[]> { return fetchJson(`/v1/events/mine/upcoming`) }
export async function myPast(): Promise<EventOut[]> { return fetchJson(`/v1/events/mine/past`) }
export async function getByToken(token: string): Promise<EventOut> { return fetchJson(`/v1/events/by-token/${token}`) }
export async function checkIn(token: string) { return fetchJson(`/v1/events/checkin`, { method: 'POST', body: JSON.stringify({ event_token: token }) }) }
export function csvUrl(eventId: number) { return `${import.meta.env.VITE_API_URL ?? '/api'}/v1/events/${eventId}/attendance.csv` }
export async function downloadAttendanceCsv(eventId: number, eventName?: string) {
  // Adjust token key names as used in your auth flow
  const token = localStorage.getItem('access_token') || localStorage.getItem('token')
  const base = import.meta.env.VITE_API_URL || 'http://localhost:8000'
  const url = `${base}/api/v1/events/${eventId}/attendance.csv`
  const resp = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include' // keeps cookies if you switch to cookie auth
  })
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status}`)
  }
  const blob = await resp.blob()
  const dlUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = dlUrl
  
  // Format filename: sanitize event name and use custom format
  const sanitizedEventName = eventName 
    ? eventName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_') 
    : `event_${eventId}`
  a.download = `${sanitizedEventName}_Attendance_Report.csv`
  
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(dlUrl)
}

export interface AttendeeOut {
  id: number
  attendee_id: number
  attendee_name: string
  attendee_email: string
  checked_in_at: string
}

export async function getEventAttendees(eventId: number): Promise<AttendeeOut[]> {
  return fetchJson<AttendeeOut[]>(`/v1/events/${eventId}/attendees`)
}