import { fetchJson } from './client';

export interface UserOut {
  id: number;
  email: string;
  name: string;
  roles: string[];
}

export async function getAllUsers(): Promise<UserOut[]> {
  return fetchJson<UserOut[]>('/v1/users/');
}

export async function promoteUser(userId: number, comment?: string): Promise<void> {
  if (comment === undefined) {
    comment = window.prompt('Comment for promoting user (optional):') || undefined;
  }
  const url = comment ? `/v1/users/${userId}/promote?comment=${encodeURIComponent(comment)}` : `/v1/users/${userId}/promote`;
  return fetchJson(url, { method: 'POST' });
}

export async function revokeOrganizer(userId: number, comment?: string): Promise<void> {
  if (comment === undefined) {
    comment = window.prompt('Comment for revoking organizer (optional):') || undefined;
  }
  const url = comment ? `/v1/users/${userId}/revoke-organizer?comment=${encodeURIComponent(comment)}` : `/v1/users/${userId}/revoke-organizer`;
  return fetchJson(url, { method: 'POST' });
}

export async function deleteUser(userId: number, comment?: string): Promise<void> {
  if (comment === undefined) {
    comment = window.prompt('Comment for deleting user (optional):') || undefined;
  }
  const url = comment ? `/v1/users/${userId}?comment=${encodeURIComponent(comment)}` : `/v1/users/${userId}`;
  return fetchJson(url, { method: 'DELETE' });
}

export async function createUser(payload: { name: string; email: string; password: string; roles: string[] }, comment?: string): Promise<UserOut> {
  if (comment === undefined) {
    comment = window.prompt('Comment for creating user (optional):') || undefined;
  }
  const url = comment ? `/v1/users/?comment=${encodeURIComponent(comment)}` : '/v1/users/';
  return fetchJson<UserOut>(url, { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } });
}
