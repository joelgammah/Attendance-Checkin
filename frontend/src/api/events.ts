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
