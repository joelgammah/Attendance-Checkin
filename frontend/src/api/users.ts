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

export async function promoteUser(userId: number): Promise<void> {
  return fetchJson(`/v1/users/${userId}/promote`, { method: 'POST' });
}

export async function revokeOrganizer(userId: number): Promise<void> {
  return fetchJson(`/v1/users/${userId}/revoke-organizer`, { method: 'POST' });
}

export async function deleteUser(userId: number): Promise<void> {
  return fetchJson(`/v1/users/${userId}`, { method: 'DELETE' });
}

export async function createUser(payload: { name: string; email: string; password: string; roles: string[] }): Promise<UserOut> {
  return fetchJson<UserOut>('/v1/users/', { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } });
}
