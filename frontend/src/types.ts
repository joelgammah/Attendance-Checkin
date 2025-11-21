export type Role = 'attendee' | 'organizer' | 'admin'

export interface User { 
  id: number
  email: string
  name: string
  roles: Role[]
  primary_role: Role
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
  recurring?: boolean
  weekdays?: string[]
  end_date?: string
  parent_id?: number
  member_count: number
}

export interface EventMember {
  user_id: number
  name: string
  email: string
  attendance_count: number
  is_flagged: boolean
}

export type SessionOut = {
  id: number;
  start_time: string;
  end_time: string;
};

export type RecurringGroup = {
  parent: EventOut;
  children: SessionOut[];
  next_session: SessionOut | null;
  past_sessions: SessionOut[];
  upcoming_sessions: SessionOut[];
  total_past_sessions: number;
};

export type DashboardItem =
  | { type: "solo"; event: EventOut }
  | { type: "recurring_group"; group: RecurringGroup };

export type DashboardEventsResponse = {
  upcoming: DashboardItem[];
  past: DashboardItem[];
};

export interface MemberAttendanceSummary {
  user_id: number
  name: string
  email: string
  attended: number
  missed: number
  is_flagged: boolean
}

export interface EventFamilyResponse {
  parent: SessionOut
  upcoming_children: SessionOut[]
  past_children: SessionOut[]
  total_past_sessions: number
  members: MemberAttendanceSummary[]
}

