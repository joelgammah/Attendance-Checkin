from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, Field
from typing import List
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo
import secrets
import re

from app.api.deps import get_db, get_current_user, require_any_role
from app.models.user import UserRole, User
from app.repositories.event_repo import EventRepository
from app.repositories.attendance_repo import AttendanceRepository
from app.models.event import Event
from app.models.attendance import Attendance
from app.core.config import settings


router = APIRouter()

event_repo = EventRepository()
att_repo = AttendanceRepository()


class EventCreate(BaseModel):
    name: str
    location: str
    start_time: str  # Changed to string to handle datetime-local input
    end_time: str    # Changed to string to handle datetime-local input
    notes: str | None = None
    checkin_open_minutes: int | None = None
    timezone: str = "America/New_York"  # Added timezone field


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

    class Config:
        from_attributes = True


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

        token = secrets.token_urlsafe(16)
        event = event_repo.create(
            db,
            name=payload.name,
            location=payload.location,
            start_time=start_utc,  # Store UTC time
            end_time=end_utc,      # Store UTC time
            notes=payload.notes,
            checkin_open_minutes=payload.checkin_open_minutes or settings.DEFAULT_CHECKIN_OPEN_MINUTES,
            checkin_token=token,
            organizer_id=user.id,
        )
        db.commit()
        db.refresh(event)
        return EventOut(
            id=event.id,
            name=event.name,
            location=event.location,
            start_time=start_utc.isoformat() + "Z",
            end_time=end_utc.isoformat() + "Z",
            notes=event.notes,
            checkin_open_minutes=event.checkin_open_minutes,
            checkin_token=event.checkin_token,
            attendance_count=0
        )

    except ValueError as e:
        raise HTTPException(400, f"Invalid datetime format: {str(e)}")
    except HTTPException as e:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error creating event: {str(e)}")


@router.get("/mine/upcoming", response_model=List[EventOut])
def my_upcoming(db: Session = Depends(get_db), user = Depends(get_current_user)):
    items = event_repo.upcoming_for_organizer(db, user.id)
    return [EventOut(
        id=e.id,
        name=e.name,
        location=e.location,
        start_time=e.start_time.isoformat() + "Z",
        end_time=e.end_time.isoformat() + "Z",
        notes=e.notes,
        checkin_open_minutes=e.checkin_open_minutes,
        checkin_token=e.checkin_token,
        attendance_count=att_repo.count_for_event(db, e.id)
    ) for e in items]


@router.get("/mine/past", response_model=List[EventOut])
def my_past(db: Session = Depends(get_db), user = Depends(get_current_user)):
    items = event_repo.past_for_organizer(db, user.id)
    return [EventOut(
        id=e.id,
        name=e.name,
        location=e.location,
        start_time=e.start_time.isoformat() + "Z",
        end_time=e.end_time.isoformat() + "Z",
        notes=e.notes,
        checkin_open_minutes=e.checkin_open_minutes,
        checkin_token=e.checkin_token,
        attendance_count=att_repo.count_for_event(db, e.id)
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


@router.get("/my-checkins", response_model=List[MyCheckInOut])
def my_checkins(db: Session = Depends(get_db), user = Depends(get_current_user)):
    """Get current user's check-in history"""
    checkins = att_repo.get_by_attendee(db, user.id)
    return [
        MyCheckInOut(
            id=att.id,
            event_id=att.event_id,
            checked_in_at=att.checked_in_at.isoformat() + "Z",
            event_name=att.event.name,
            event_location=att.event.location,
            event_start_time=att.event.start_time.isoformat() + "Z"
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
        start_time=e.start_time.isoformat() + "Z",
        end_time=e.end_time.isoformat() + "Z",
        notes=e.notes,
        checkin_open_minutes=e.checkin_open_minutes,
        checkin_token=e.checkin_token,
        attendance_count=count
    )