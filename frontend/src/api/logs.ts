import { fetchJson } from './client';

export interface AuditLog {
  id: number;
  action: string;
  user_email: string;
  timestamp: string;
  resource_type: string | null;
  resource_id: string | null;
  details: string;
  ip_address: string | null;
  // Add more fields as needed
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  return fetchJson<AuditLog[]>('/v1/audit_logs/');
}
