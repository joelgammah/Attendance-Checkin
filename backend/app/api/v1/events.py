from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, Field
from typing import List
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
import secrets

from app.api.deps import get_db, get_current_user
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
    start_time: datetime
    end_time: datetime
    notes: str | None = None
    checkin_open_minutes: int | None = None


class EventOut(BaseModel):
    id: int
    name: str
    location: str
    start_time: datetime
    end_time: datetime
    notes: str | None
    checkin_open_minutes: int
    checkin_token: str
    attendance_count: int = 0

    class Config:
        from_attributes = True


@router.post("/", response_model=EventOut)
def create_event(payload: EventCreate, db: Session = Depends(get_db), user = Depends(get_current_user)):
    if user.role not in (UserRole.ORGANIZER, UserRole.ADMIN):
        raise HTTPException(403, "Only organizers can create events")
    token = secrets.token_urlsafe(16)
    event = event_repo.create(
        db,
        name=payload.name,
        location=payload.location,
        start_time=payload.start_time,
        end_time=payload.end_time,
        notes=payload.notes,
        checkin_open_minutes=payload.checkin_open_minutes or settings.DEFAULT_CHECKIN_OPEN_MINUTES,
        checkin_token=token,
        organizer_id=user.id,
    )
    db.commit()
    db.refresh(event)
    return EventOut.model_validate({**event.__dict__, "attendance_count": 0})


@router.get("/mine/upcoming", response_model=List[EventOut])
def my_upcoming(db: Session = Depends(get_db), user = Depends(get_current_user)):
    items = event_repo.upcoming_for_organizer(db, user.id)
    return [EventOut.model_validate({**e.__dict__, "attendance_count": att_repo.count_for_event(db, e.id)}) for e in items]


@router.get("/mine/past", response_model=List[EventOut])
def my_past(db: Session = Depends(get_db), user = Depends(get_current_user)):
    items = event_repo.past_for_organizer(db, user.id)
    return [EventOut.model_validate({**e.__dict__, "attendance_count": att_repo.count_for_event(db, e.id)}) for e in items]


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
    checked_in_at: datetime
    event_name: str
    event_location: str
    event_start_time: datetime

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
            checked_in_at=att.checked_in_at,
            event_name=att.event.name,
            event_location=att.event.location,
            event_start_time=att.event.start_time
        ) for att in checkins
    ]


@router.post("/checkin", response_model=AttendanceOut)
def check_in(req: CheckInRequest, db: Session = Depends(get_db), user = Depends(get_current_user)):
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
def export_csv(event_id: int, db: Session = Depends(get_db), user = Depends(get_current_user)):
    event = event_repo.get(db, event_id)
    if not event:
        raise HTTPException(404, "Event not found")
    if user.role not in (UserRole.ORGANIZER, UserRole.ADMIN) or event.organizer_id != user.id:
        raise HTTPException(403, "Forbidden")

    # Includes attendee name & email
    records = (
        db.query(Attendance, User)
        .join(User, Attendance.attendee_id == User.id)
        .filter(Attendance.event_id == event_id)
        .order_by(Attendance.checked_in_at.asc())
        .all()
    )

    header = "attendance_id,event_id,attendee_id,attendee_name,attendee_email,checked_in_at\n"
    body_lines = []
    for att, usr in records:
        body_lines.append(
            f"{att.id},{att.event_id},{att.attendee_id},"
            f"{(usr.name or '').replace(',', ' ')},{(usr.email or '')},{att.checked_in_at.isoformat()}"
        )
    body = header + "\n".join(body_lines) + ("\n" if body_lines else "")
    return Response(content=body, media_type="text/csv")


@router.get("/by-token/{token}", response_model=EventOut)
def get_by_token(token: str, db: Session = Depends(get_db), user = Depends(get_current_user)):
    e = event_repo.get_by_token(db, token)
    if not e:
        raise HTTPException(404, "Event not found")
    count = att_repo.count_for_event(db, e.id)
    return EventOut.model_validate({**e.__dict__, "attendance_count": count})
