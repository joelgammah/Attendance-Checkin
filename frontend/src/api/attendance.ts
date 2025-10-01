import { fetchJson } from './client'

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