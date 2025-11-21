from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, ConfigDict, Field
from typing import List
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta, date
from zoneinfo import ZoneInfo
import secrets
import re

from app.api.deps import get_db, get_current_user, require_any_role
from app.repositories.audit_log_repo import AuditLogRepository
from app.models.user import UserRole, User
from app.repositories.event_repo import EventRepository
from app.repositories.attendance_repo import AttendanceRepository
from app.repositories.event_member_repo import EventMemberRepository

from app.models.event import Event
from app.models.attendance import Attendance
from app.core.config import settings
from app.models.event_member import EventMember


router = APIRouter()

event_repo = EventRepository()
att_repo = AttendanceRepository()
event_member_repo = EventMemberRepository()


def serialize_datetime(dt: datetime) -> str:
    """Convert timezone-aware datetime to UTC ISO string with 'Z' suffix"""
    if dt.tzinfo is not None:
        # Convert to UTC and remove timezone info, then add 'Z'
        dt_utc = dt.astimezone(timezone.utc)
        return dt_utc.replace(tzinfo=None).isoformat() + 'Z'
    else:
        # Naive datetime, assume UTC
        return dt.isoformat() + 'Z'


class EventCreate(BaseModel):
    name: str
    location: str
    start_time: str  # Changed to string to handle datetime-local input
    end_time: str    # Changed to string to handle datetime-local input
    notes: str | None = None
    checkin_open_minutes: int | None = None
    timezone: str = "America/New_York"  # Added timezone field
    #new fields for recurring logic
    recurring: bool = False
    weekdays: List[str] | None = None
    end_date: str | None = None
    parent_id: int | None = None
    attendance_threshold: int | None = None
    member_ids: List[int] | None = None  # New field for event members

class EventOut(BaseModel):
    id: int
    name: str
    location: str
    start_time: str  # Changed from datetime to str for explicit UTC format
    end_time: str    # Changed from datetime to str for explicit UTC format
    notes: str | None
    checkin_open_minutes: int
    checkin_token: str
    attendance_count: int = 0
    #new fields for recurring logic
    recurring: bool = False
    weekdays: List[str] | None = None
    end_date: str | None = None
    parent_id: int | None = None
    organizer_name: str | None = None
    attendance_threshold: int | None = None
    member_count: int = 0


    class Config:
        from_attributes = True

class SessionOut(BaseModel):
    id: int
    start_time: datetime
    end_time: datetime

    model_config = ConfigDict(from_attributes=True)

class SessionListOut(BaseModel):
    id: int
    start_time: str
    end_time: str
    checkin_token: str


class MemberAttendanceOut(BaseModel):
    user_id: int
    name: str
    email: str
    attended: int
    missed: int
    is_flagged: bool

class EventFamilyOut(BaseModel):
    parent: EventOut
    past_children: list[SessionListOut]
    upcoming_children: list[SessionListOut]
    members: list[MemberAttendanceOut]
    total_past_sessions: int

    class Config:
        from_attributes = True


def get_dates_between(start_date: date, end_date: date, weekdays: List[str]) -> List[date]:
    """Helper function to get all dates between start and end that match given weekdays"""
    # Convert weekday names to numbers (Monday = 0, Sunday = 6)
    weekday_map = {
        'Mon': 0, 'Monday': 0,
        'Tue': 1, 'Tuesday': 1,
        'Wed': 2, 'Wednesday': 2,
        'Thu': 3, 'Thursday': 3,
        'Fri': 4, 'Friday': 4,
        'Sat': 5, 'Saturday': 5,
        'Sun': 6, 'Sunday': 6
    }
    selected_weekdays = [weekday_map[day] for day in weekdays]
    
    dates = []
    current = start_date
    while current <= end_date:
        if current.weekday() in selected_weekdays:
            dates.append(current)
        current += timedelta(days=1)
    return dates


@router.post("/", response_model=EventOut)
def create_event(
    payload: EventCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_any_role(UserRole.ORGANIZER, UserRole.ADMIN)),
):
    
    try:
        # Parse naive datetime from frontend
        start_naive = datetime.fromisoformat(payload.start_time)
        end_naive = datetime.fromisoformat(payload.end_time)

        # Apply user's timezone (from frontend)
        user_timezone = ZoneInfo(payload.timezone)  # "America/New_York"
        start_local = start_naive.replace(tzinfo=user_timezone)
        end_local = end_naive.replace(tzinfo=user_timezone)

        # Convert to UTC for storage
        start_utc = start_local.astimezone(timezone.utc)
        end_utc = end_local.astimezone(timezone.utc)

        # Validation
        if start_utc >= end_utc:
            raise HTTPException(400, "Start time must be before end time")
        
        end_date_utc = None
        if payload.end_date:
            end_date_local = datetime.strptime(payload.end_date, "%Y-%m-%d").replace(
                hour=end_naive.hour,
                minute=end_naive.minute,
                tzinfo=user_timezone
            )
            end_date_utc = end_date_local.astimezone(timezone.utc)
            
        token = secrets.token_urlsafe(16)
        parent_event = event_repo.create(
            db,
            name=payload.name,
            location=payload.location,
            start_time=start_utc,  # Store UTC time
            end_time=end_utc,      # Store UTC time
            notes=payload.notes,
            checkin_open_minutes=payload.checkin_open_minutes or settings.DEFAULT_CHECKIN_OPEN_MINUTES,
            checkin_token=token,
            organizer_id=user.id,
            recurring=payload.recurring,
            weekdays=payload.weekdays,
            end_date=end_date_utc,
            #first event is the parent/ not recurring so parent_id is None
            parent_id=None

        )
        if payload.attendance_threshold is not None:
            parent_event.attendance_threshold = payload.attendance_threshold
        
        db.flush()

        # Add event members if provided
        if payload.member_ids:
            for member_id in payload.member_ids:
                event_member_repo.add_member(
                    db,
                    parent_event.id,
                    member_id
                )

        if payload.recurring and payload.weekdays and payload.end_date:
            # Create recurring events
            start_date_only = start_local.date()
            end_date_only = end_date_utc.date()
            recurring_dates = get_dates_between(start_date_only, end_date_only, payload.weekdays)
            #skip first date since it's already created
            if len(recurring_dates) > 1:
                for rd in recurring_dates[1:]:
                    new_start_local = datetime.combine(rd, start_local.time(), tzinfo=user_timezone)
                    new_end_local = datetime.combine(rd, end_local.time(), tzinfo=user_timezone)
                    new_start_utc = new_start_local.astimezone(timezone.utc)
                    new_end_utc = new_end_local.astimezone(timezone.utc)

                    print(f"Creating recurring event on {rd} (local={new_start_local}, utc={new_start_utc})")


                    child_event = event_repo.create(
                        db,
                        name=payload.name,
                        location=payload.location,
                        start_time=new_start_utc,
                        end_time=new_end_utc,
                        notes=payload.notes,
                        checkin_open_minutes=payload.checkin_open_minutes or settings.DEFAULT_CHECKIN_OPEN_MINUTES,
                        checkin_token=secrets.token_urlsafe(16),
                        organizer_id=user.id,
                        recurring=True,
                        weekdays=payload.weekdays,
                        end_date=end_date_utc,
                        parent_id=parent_event.id  # Link to parent event
                    )

                    if payload.attendance_threshold is not None:
                        child_event.attendance_threshold = payload.attendance_threshold

                    db.flush()

                    # Add event members to child event
                    if payload.member_ids:
                        for member_id in payload.member_ids:
                            event_member_repo.add_member(
                                db,
                                child_event.id,
                                member_id
                            )
        db.commit()
        db.refresh(parent_event)

        AuditLogRepository.log_audit(
            db,
            action="create_event",
            user_email=user.email,
            timestamp=datetime.utcnow(),
            resource_type="event",
            resource_id=str(parent_event.id),
            details=f"Created event: {parent_event.name}"
        )
        #returns parent event only for now
        return EventOut(
            id=parent_event.id,
            name=parent_event.name,
            location=parent_event.location,
            start_time=serialize_datetime(start_utc),
            end_time=serialize_datetime(end_utc),
            notes=parent_event.notes,
            checkin_open_minutes=parent_event.checkin_open_minutes,
            checkin_token=parent_event.checkin_token,
            attendance_count=0,
            recurring=parent_event.recurring,
            weekdays=parent_event.weekdays,
            end_date=serialize_datetime(parent_event.end_date) if parent_event.end_date else None,
            parent_id=parent_event.parent_id,
            member_count=len(event_member_repo.list_members(db, parent_event.id))
        )

    except ValueError as e:
        raise HTTPException(400, f"Invalid datetime format: {str(e)}")
    except HTTPException as e:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error creating event: {str(e)}")

@router.get("/", response_model=List[EventOut])
def list_all_events(db: Session = Depends(get_db), admin: User = Depends(require_any_role(UserRole.ADMIN))):
    """List all events (admin only)"""
    events = db.query(Event).all()
    result = []
    for e in events:
        attendance_count = att_repo.count_for_event(db, e.id)
        organizer = db.query(User).filter(User.id == e.organizer_id).first()
        organizer_name = organizer.name if organizer else "Unknown"
        result.append(EventOut(
            id=e.id,
            name=e.name,
            location=e.location,
            start_time=serialize_datetime(e.start_time),
            end_time=serialize_datetime(e.end_time),
            notes=e.notes,
            checkin_open_minutes=e.checkin_open_minutes,
            checkin_token=e.checkin_token,
            attendance_count=attendance_count,
            recurring=e.recurring,
            weekdays=e.weekdays,
            end_date=serialize_datetime(e.end_date) if e.end_date else None,
            parent_id=e.parent_id,
            organizer_name=organizer_name
        ))
    return result

@router.get("/mine/upcoming", response_model=List[EventOut])
def my_upcoming(db: Session = Depends(get_db), user = Depends(get_current_user)):
    items = event_repo.upcoming_for_organizer(db, user.id)
    return [EventOut(
        id=e.id,
        name=e.name,
        location=e.location,
        start_time=serialize_datetime(e.start_time),
        end_time=serialize_datetime(e.end_time),
        notes=e.notes,
        checkin_open_minutes=e.checkin_open_minutes,
        checkin_token=e.checkin_token,
        attendance_count=att_repo.count_for_event(db, e.id),
        recurring=e.recurring,
        weekdays=e.weekdays,
        end_date=serialize_datetime(e.end_date) if e.end_date else None,
        parent_id=e.parent_id
    ) for e in items]


@router.get("/mine/past", response_model=List[EventOut])
def my_past(db: Session = Depends(get_db), user = Depends(get_current_user)):
    items = event_repo.past_for_organizer(db, user.id)
    return [EventOut(
        id=e.id,
        name=e.name,
        location=e.location,
        start_time=serialize_datetime(e.start_time),
        end_time=serialize_datetime(e.end_time),
        notes=e.notes,
        checkin_open_minutes=e.checkin_open_minutes,
        checkin_token=e.checkin_token,
        attendance_count=att_repo.count_for_event(db, e.id),
        recurring=e.recurring,
        weekdays=e.weekdays,
        end_date=serialize_datetime(e.end_date) if e.end_date else None,
        parent_id=e.parent_id
    ) for e in items]


class CheckInRequest(BaseModel):
    event_token: str = Field(..., description="Event QR token")


class AttendanceOut(BaseModel):
    id: int
    event_id: int
    attendee_id: int
    checked_in_at: datetime

    class Config:
        from_attributes = True


class MyCheckInOut(BaseModel):
    id: int
    event_id: int
    checked_in_at: str  # Changed from datetime to str for explicit UTC format
    event_name: str
    event_location: str
    event_start_time: str  # Changed from datetime to str for explicit UTC format

    class Config:
        from_attributes = True


class AttendeeOut(BaseModel):
    id: int
    attendee_id: int
    attendee_name: str
    attendee_email: str
    checked_in_at: str  # Changed from datetime to str for explicit UTC format

    class Config:
        from_attributes = True


@router.get("/my-checkins", response_model=List[MyCheckInOut])
def my_checkins(db: Session = Depends(get_db), user = Depends(get_current_user)):
    """Get current user's check-in history"""
    checkins = att_repo.get_by_attendee(db, user.id)
    return [
        MyCheckInOut(
            id=att.id,
            event_id=att.event_id,
            checked_in_at=serialize_datetime(att.checked_in_at),
            event_name=att.event.name,
            event_location=att.event.location,
            event_start_time=serialize_datetime(att.event.start_time)
        ) for att in checkins
    ]


@router.post("/checkin", response_model=AttendanceOut)
def check_in(
    req: CheckInRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_any_role(UserRole.ATTENDEE, UserRole.ORGANIZER, UserRole.ADMIN)),
):
    event = event_repo.get_by_token(db, req.event_token)
    if not event:
        raise HTTPException(404, "Event not found")

    now = datetime.now(timezone.utc)
    start = event.start_time
    end = event.end_time
    if start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)
    if end.tzinfo is None:
        end = end.replace(tzinfo=timezone.utc)
    open_at = start - timedelta(minutes=event.checkin_open_minutes)
    if not (open_at <= now <= end):
        raise HTTPException(400, "Check-in not open for this event")

    # Check if user has already checked in
    existing_attendance = att_repo.get_by_event_and_user(db, event.id, user.id)
    if existing_attendance:
        raise HTTPException(400, "You have already checked in for this event")

    # Upsert-like: unique constraint prevents duplicates; try to create
    att = att_repo.create(
        db,
        event_id=event.id,
        attendee_id=user.id,
        checked_in_at=now,
        source_ip=None,
        user_agent=None,
    )
    db.commit()
    AuditLogRepository.log_audit(
        db,
        action="check_in",
        user_email=user.email,
        timestamp=datetime.utcnow(),
        resource_type="attendance",
        resource_id=str(att.id),
        details=f"Checked in to event: {event.name}"
    )
    db.refresh(att)
    return att


@router.get("/{event_id}/attendance.csv")
def export_csv(event_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    event = event_repo.get(db, event_id)
    if not event:
        raise HTTPException(404, "Event not found")
    
    # Allow admins or event organizer to export
    user_roles = user.roles()
    is_admin = UserRole.ADMIN in user_roles
    is_event_organizer = event.organizer_id == user.id
    
    if not (is_admin or is_event_organizer):
        raise HTTPException(403, "Forbidden")

    # EXCLUDE organizer (do not list the event creator in the CSV)
    records = (
        db.query(Attendance, User)
        .join(User, Attendance.attendee_id == User.id)
        .filter(
            Attendance.event_id == event_id
        )
        .order_by(Attendance.checked_in_at.asc())
        .all()
    )

    def esc(val: str | None):
        if val is None:
            return ""
        s = str(val)
        if '"' in s:
            s = s.replace('"', '""')
        if ',' in s or '"' in s:
            return f'"{s}"'
        return s

    header = "Event Name,Event Location,Attendee ID,Attendee Name,Attendee Email,Date/Time Checked In\n"
    ev_name = esc(getattr(event, "name", "") or "")
    ev_loc = esc(getattr(event, "location", "") or "")  # existing line (kept)

    # ADD: Normalize location to insert comma before 2‑letter state if missing (e.g. "Spartanburg SC" -> "Spartanburg, SC")
    raw_location = getattr(event, "location", "") or ""
    if raw_location and "," not in raw_location:
        m = re.match(r"^(?P<city>.+?)\s(?P<state>[A-Z]{2})(?:,\s*USA)?$", raw_location)
        if m:
            formatted = f"{m.group('city').rstrip()}, {m.group('state')}"
            ev_loc = esc(formatted)

    lines: list[str] = []
    for att, usr in records:
        lines.append(
            f"{ev_name},{ev_loc},{att.attendee_id},{esc(usr.name)},{esc(usr.email)},{att.checked_in_at.isoformat()}"
        )

    # Get organizer information
    organizer = db.query(User).filter(User.id == event.organizer_id).first()
    organizer_name = organizer.name if organizer else "Unknown"
    total_attendance = len(records)

    # Build CSV with summary at the end
    csv_body = header + "\n".join(lines)
    if lines:
        csv_body += "\n"
    
    # Add blank line and summary in columns
    csv_body += "\n"
    csv_body += f"Organizer Name:,{esc(organizer_name)}\n"
    csv_body += f"Total Attendance:,{total_attendance}\n"

    return Response(content=csv_body, media_type="text/csv")


@router.get("/by-token/{token}", response_model=EventOut)
def get_by_token(token: str, db: Session = Depends(get_db), user = Depends(get_current_user)):
    e = event_repo.get_by_token(db, token)
    if not e:
        raise HTTPException(404, "Event not found")
    count = att_repo.count_for_event(db, e.id)
    return EventOut(
        id=e.id,
        name=e.name,
        location=e.location,
        start_time=serialize_datetime(e.start_time),
        end_time=serialize_datetime(e.end_time),
        notes=e.notes,
        checkin_open_minutes=e.checkin_open_minutes,
        checkin_token=e.checkin_token,
        attendance_count=count,
        recurring=e.recurring,
        weekdays=e.weekdays,
        end_date=serialize_datetime(e.end_date) if e.end_date else None,
        parent_id=e.parent_id
    )


@router.get("/{event_id}", response_model=EventOut)
def get_event_by_id(event_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Get event details by ID"""
    event = event_repo.get(db, event_id)
    if not event:
        raise HTTPException(404, "Event not found")
    
    # Allow admins or event organizer to view event
    user_roles = user.roles()
    is_admin = UserRole.ADMIN in user_roles
    is_event_organizer = event.organizer_id == user.id
    
    if not (is_admin or is_event_organizer):
        raise HTTPException(403, "Forbidden")
    
    count = att_repo.count_for_event(db, event.id)
    return EventOut(
        id=event.id,
        name=event.name,
        location=event.location,
        start_time=serialize_datetime(event.start_time),
        end_time=serialize_datetime(event.end_time),
        notes=event.notes,
        checkin_open_minutes=event.checkin_open_minutes,
        checkin_token=event.checkin_token,
        attendance_count=count,
        recurring=event.recurring,
        weekdays=event.weekdays,
        end_date=serialize_datetime(event.end_date) if event.end_date else None,
        parent_id=event.parent_id
    )


@router.get("/{event_id}/attendees", response_model=List[AttendeeOut])
def get_event_attendees(event_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Get all attendees for a specific event"""
    event = event_repo.get(db, event_id)
    if not event:
        raise HTTPException(404, "Event not found")
    
    # Allow admins or event organizer to view attendees
    user_roles = user.roles()
    is_admin = UserRole.ADMIN in user_roles
    is_event_organizer = event.organizer_id == user.id
    
    if not (is_admin or is_event_organizer):
        raise HTTPException(403, "Forbidden")

    # Get attendance records with user information
    records = (
        db.query(Attendance, User)
        .join(User, Attendance.attendee_id == User.id)
        .filter(Attendance.event_id == event_id)
        .order_by(Attendance.checked_in_at.asc())
        .all()
    )

    return [
        AttendeeOut(
            id=att.id,
            attendee_id=att.attendee_id,
            attendee_name=usr.name,
            attendee_email=usr.email,
            checked_in_at=serialize_datetime(att.checked_in_at)
        ) for att, usr in records
    ]

# --- Event Deletion: Admin or Organizer ---
@router.delete("/{event_id}")
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    event = event_repo.get(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    user_roles = user.roles()
    is_admin = UserRole.ADMIN in user_roles
    is_event_organizer = event.organizer_id == user.id
    if not (is_admin or is_event_organizer):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    db.delete(event)
    db.commit()
    AuditLogRepository.log_audit(
        db,
        action="delete_event",
        user_email=user.email,
        timestamp=datetime.utcnow(),
        resource_type="event",
        resource_id=str(event.id),
        details=f"Deleted event: {event.name}"
    )
    return {"detail": "Event deleted"}

@router.get("/{parent_id}/family", response_model=EventFamilyOut)
def get_event_family(parent_id: int, db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)

    parent = db.get(Event, parent_id)
    if not parent:
        raise HTTPException(404, "Parent event not found")

    # Fetch children
    children = (
        db.query(Event)
        .filter(Event.parent_id == parent_id)
        .order_by(Event.start_time)
        .all()
    )

    past_children = [ev for ev in children if ev.start_time < now]
    upcoming_children = [ev for ev in children if ev.start_time >= now]

    # Count total past sessions (parent counts as one if in the past)
    total_past_sessions = len(past_children)
    if parent.start_time < now:
        total_past_sessions += 1

    # Get parent members
    members = event_member_repo.list_members_for_parent(db, parent_id)

    member_summaries = []
    for m in members:
        attended = event_member_repo.get_member_attendance_count(
            db, parent_id, m.user_id
        )

        missed = max(total_past_sessions - attended, 0)

        is_flagged = (
            parent.attendance_threshold is not None
            and missed > parent.attendance_threshold
        )

        member_summaries.append(MemberAttendanceOut(
            user_id=m.user_id,
            name=m.user.name,
            email=m.user.email,
            attended=attended,
            missed=missed,
            is_flagged=is_flagged
        ))

    # ---- FULL EventOut serialization for parent ----
    parent_out = EventOut(
        id=parent.id,
        name=parent.name,
        location=parent.location,
        start_time=serialize_datetime(parent.start_time),
        end_time=serialize_datetime(parent.end_time),
        notes=parent.notes,
        checkin_open_minutes=parent.checkin_open_minutes,
        checkin_token=parent.checkin_token,
        attendance_count = att_repo.count_for_event(db, parent.id),      
        recurring=parent.recurring,
        weekdays=parent.weekdays,
        end_date=serialize_datetime(parent.end_date) if parent.end_date else None,
        parent_id=parent.parent_id,
        organizer_name=parent.organizer.name if parent.organizer else None,
        attendance_threshold=parent.attendance_threshold,
        member_count=len(members)
    )

    # ---- SessionOut for children ----
    past_children_out = [
        SessionListOut(
            id=ev.id,
            start_time=serialize_datetime(ev.start_time),
            end_time=serialize_datetime(ev.end_time),
            checkin_token=ev.checkin_token
        ) for ev in past_children
    ]

    upcoming_children_out = [
        SessionListOut(
            id=ev.id,
            start_time=serialize_datetime(ev.start_time),
            end_time=serialize_datetime(ev.end_time),
            checkin_token=ev.checkin_token
        ) for ev in upcoming_children
    ]

    # Return final response
    return EventFamilyOut(
        parent=parent_out,
        past_children=past_children_out,
        upcoming_children=upcoming_children_out,
        members=member_summaries,
        total_past_sessions=total_past_sessions
    )


class GroupedEventOut(BaseModel):
    parent: SessionOut
    children: List[SessionOut]

    model_config = ConfigDict(from_attributes=True)



@router.get("/grouped", response_model=list[GroupedEventOut])
def get_grouped_events(
    db: Session = Depends(get_db),
    user: User = Depends(require_any_role(UserRole.ORGANIZER, UserRole.ADMIN))
):
    # Fetch ONLY recurring parent events
    parents = (
        db.query(Event)
        .filter(Event.parent_id == None, Event.recurring == True)
        .order_by(Event.start_time)
        .all()
    )

    results = []

    for parent in parents:
        # Fetch children for this parent
        children = (
            db.query(Event)
            .filter(Event.parent_id == parent.id)
            .order_by(Event.start_time)
            .all()
        )

        # Convert to Pydantic using your EventOut-compatible schema
        results.append(
            GroupedEventOut(
                parent=SessionOut.model_validate(parent),
                children=[SessionOut.model_validate(ch) for ch in children],
            )
        )

    return results


class DashboardEventsOut(BaseModel):
    upcoming: list
    past: list

class DashboardSoloEvent(BaseModel):
    type: str = "solo"
    event: EventOut

class RecurringGroupOut(BaseModel):
    parent: EventOut
    children: list[SessionOut]
    next_session: SessionOut | None
    past_sessions: list[SessionOut]
    upcoming_sessions: list[SessionOut]
    total_past_sessions: int

class DashboardRecurringGroup(BaseModel):
    type: str = "recurring_group"
    group: RecurringGroupOut

@router.get("/dashboard/events", response_model=DashboardEventsOut)
def get_dashboard_events(
    db: Session = Depends(get_db),
    user: User = Depends(require_any_role(UserRole.ORGANIZER, UserRole.ADMIN)),
):
    now = datetime.now(timezone.utc)

    # ----------------------------------------
    # 1. Fetch solo parents (not recurring)
    # ----------------------------------------
    solo_events = (
        db.query(Event)
        .filter(
            Event.organizer_id == user.id,
            Event.parent_id == None,
            Event.recurring == False,
        )
        .order_by(Event.start_time)
        .all()
    )

    # ----------------------------------------
    # 2. Fetch recurring parents
    # ----------------------------------------
    recurring_parents = (
        db.query(Event)
        .filter(
            Event.organizer_id == user.id,
            Event.parent_id == None,
            Event.recurring == True,
        )
        .order_by(Event.start_time)
        .all()
    )

    # ----------------------------------------
    # Prepare output buckets
    # ----------------------------------------
    upcoming_list = []
    past_list = []

    # ----------------------------------------
    # 3. Process solo events
    # ----------------------------------------
    for ev in solo_events:
        wrapped = DashboardSoloEvent(
            event=EventOut(
                id=ev.id,
                name=ev.name,
                location=ev.location,
                start_time=serialize_datetime(ev.start_time),
                end_time=serialize_datetime(ev.end_time),
                notes=ev.notes,
                checkin_open_minutes=ev.checkin_open_minutes,
                checkin_token=ev.checkin_token,
                attendance_count=att_repo.count_for_event(db, ev.id),
                recurring=ev.recurring,
                weekdays=ev.weekdays,
                end_date=serialize_datetime(ev.end_date) if ev.end_date else None,
                parent_id=ev.parent_id,
                member_count=len(event_member_repo.list_members(db, ev.id))
            )
        )

        if ev.start_time >= now:
            upcoming_list.append(wrapped)
        else:
            past_list.append(wrapped)

    # ----------------------------------------
    # 4. Process recurring groups
    # ----------------------------------------
    for parent in recurring_parents:

        children = (
            db.query(Event)
            .filter(Event.parent_id == parent.id)
            .order_by(Event.start_time)
            .all()
        )

        # Convert children → SessionOut list
        children_out = [SessionOut.model_validate(ch) for ch in children]

        # Split by time
        past_children = [ch for ch in children if ch.start_time < now]
        upcoming_children = [ch for ch in children if ch.start_time >= now]

        # Total past sessions includes parent session
        total_past_sessions = len(past_children)
        if parent.start_time < now:
            total_past_sessions += 1

        # --------------------------------------------------
        # New correct next-session logic (parent + children)
        # --------------------------------------------------

        # Combine parent + children as raw Event models
        all_sessions = [parent] + children

        # Sort by start time
        all_sorted = sorted(all_sessions, key=lambda e: e.start_time)

        # 1. Check for a currently active session
        active_raw = next(
            (ev for ev in all_sorted if ev.start_time <= now <= ev.end_time),
            None
        )

        if active_raw:
            next_session_raw = active_raw
        else:
            # 2. First session in the future
            next_session_raw = next(
                (ev for ev in all_sorted if ev.start_time >= now),
                None
            )

        # Convert to SessionOut
        next_session = (
            SessionOut(
                id=next_session_raw.id,
                start_time=serialize_datetime(next_session_raw.start_time),
                end_time=serialize_datetime(next_session_raw.end_time),
            )
            if next_session_raw else None
        )


        group = RecurringGroupOut(
            parent=EventOut(
                id=parent.id,
                name=parent.name,
                location=parent.location,
                start_time=serialize_datetime(parent.start_time),
                end_time=serialize_datetime(parent.end_time),
                notes=parent.notes,
                checkin_open_minutes=parent.checkin_open_minutes,
                checkin_token=parent.checkin_token,
                attendance_count=att_repo.count_for_event(db, parent.id),
                recurring=parent.recurring,
                weekdays=parent.weekdays,
                end_date=serialize_datetime(parent.end_date) if parent.end_date else None,
                parent_id=parent.parent_id,
                member_count=len(event_member_repo.list_members(db, parent.id)),
                attendance_threshold=parent.attendance_threshold
            ),
            children=children_out,
            next_session=next_session,
            past_sessions=[SessionOut.model_validate(ch) for ch in past_children],
            upcoming_sessions=[SessionOut.model_validate(ch) for ch in upcoming_children],
            total_past_sessions=total_past_sessions
        )

        wrapped = DashboardRecurringGroup(group=group)

        # Classification:
        # - If there is any upcoming child → upcoming
        # - If not, the whole series is past
        if upcoming_children:
            upcoming_list.append(wrapped)
        else:
            past_list.append(wrapped)

    # ----------------------------------------
    # Final output
    # ----------------------------------------
    return DashboardEventsOut(
        upcoming=upcoming_list,
        past=past_list
    )


class MyEventSummary(BaseModel):
    parent: EventOut
    next_session: SessionOut | None
    attended: int
    missed: int
    flagged: bool
    total_past_sessions: int

    class Config:
        from_attributes = True

class MyEventsOut(BaseModel):
    events: list[MyEventSummary]

@router.get("/attendee/my-events", response_model=MyEventsOut)
def get_my_events(
    db: Session = Depends(get_db),
    user: User = Depends(require_any_role(UserRole.ATTENDEE, UserRole.ORGANIZER, UserRole.ADMIN)),
):
    now = datetime.now(timezone.utc)

    # 1. Get ALL event_members rows for this user
    memberships = event_member_repo.get_events_for_user(db, user.id)
    if not memberships:
        return MyEventsOut(events=[])

    results = []

    for mem in memberships:
        event = db.get(Event, mem.event_id)

        # Skip solo events or child events
        if not event or not event.recurring or event.parent_id is not None:
            continue

        parent = event

        # -----------------------------
        # Load children
        # -----------------------------
        children = (
            db.query(Event)
            .filter(Event.parent_id == parent.id)
            .order_by(Event.start_time)
            .all()
        )

        children_out = [SessionOut.model_validate(c) for c in children]

        # -----------------------------
        # Past / upcoming
        # -----------------------------
        past_children = [c for c in children if c.start_time < now]
        upcoming_children = [c for c in children if c.start_time >= now]

        total_past_sessions = len(past_children)
        if parent.start_time < now:
            total_past_sessions += 1

        # Attendance for THIS user
        attended_count = event_member_repo.get_member_attendance_count(
            db, parent.id, user.id
        )
        missed_count = max(total_past_sessions - attended_count, 0)

        flagged = (
            parent.attendance_threshold is not None
            and missed_count > parent.attendance_threshold
        )

        # -----------------------------
        # Next session logic
        # -----------------------------
        next_session_raw = None

        if parent.start_time >= now:
            next_session_raw = parent
        elif upcoming_children:
            next_session_raw = upcoming_children[0]

        next_session = (
            SessionOut.model_validate(next_session_raw)
            if next_session_raw else None
        )

        # -----------------------------
        # Construct EventOut manually
        # -----------------------------
        parent_out = EventOut(
            id=parent.id,
            name=parent.name,
            location=parent.location,
            start_time=serialize_datetime(parent.start_time),
            end_time=serialize_datetime(parent.end_time),
            notes=parent.notes,
            checkin_open_minutes=parent.checkin_open_minutes,
            checkin_token=parent.checkin_token,
            attendance_count=att_repo.count_for_event(db, parent.id),
            recurring=parent.recurring,
            weekdays=parent.weekdays,
            end_date=serialize_datetime(parent.end_date) if parent.end_date else None,
            parent_id=parent.parent_id,
            member_count=len(event_member_repo.list_members(db, parent.id)),
            attendance_threshold=parent.attendance_threshold
        )

        results.append(
            MyEventSummary(
                parent=parent_out,
                next_session=next_session,
                attended=attended_count,
                missed=missed_count,
                flagged=flagged,
                total_past_sessions=total_past_sessions
            )
        )

    return MyEventsOut(events=results)
