import { fetchJson } from './client'
import type { EventOut, SessionOut } from '../types'

// ------------------------------
// Attendee: My Events Overview
// ------------------------------

export interface MyEventSummary {
  parent: EventOut                 // full event
  next_session: SessionOut | null  // next session the attendee can go to
  attended: number
  missed: number
  flagged: boolean
  total_past_sessions: number
}

export interface MyEventsOut {
  events: MyEventSummary[]
}

export interface MyCheckIn {
  id: number
  event_id: number
  checked_in_at: string
  event_name: string
  event_location: string
  event_start_time: string
}

export async function getMyCheckIns(): Promise<MyCheckIn[]> {
  return fetchJson<MyCheckIn[]>('/v1/events/my-checkins')
}

export async function checkIn(eventToken: string) {
  return fetchJson('/v1/events/checkin', {
    method: 'POST',
    body: JSON.stringify({ event_token: eventToken })
  })
}


export async function getMyEvents(): Promise<MyEventSummary[]> {
  const data = await fetchJson<MyEventsOut>('/v1/events/attendee/my-events')
  return data.events
}
