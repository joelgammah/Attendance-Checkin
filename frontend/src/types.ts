export type Role = 'attendee' | 'organizer' | 'admin'
<<<<<<< HEAD
export interface User { id: number; email: string; name: string; role: Role }
export interface EventOut {
    id: number;
    name: string;
    location: string;
    start_time: string;
    end_time: string;
    notes?: string|null;
    checkin_open_minutes: number;
    checkin_token: string;
    attendance_count: number;
    recurring?: boolean;
    weekdays?: string[];
    end_date?: string;
    parent_id?: number;
=======

export interface User { 
  id: number
  email: string
  name: string
  role: Role  // legacy
  roles?: Role[]
  primary_role?: Role
}

export interface EventOut { 
  id: number
  name: string
  location: string
  start_time: string
  end_time: string
  notes?: string|null
  checkin_open_minutes: number
  checkin_token: string
  attendance_count: number
>>>>>>> origin/main
}
