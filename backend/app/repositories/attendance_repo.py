from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, func
from app.repositories.base import BaseRepository
from app.models.attendance import Attendance


class AttendanceRepository(BaseRepository[Attendance]):
    def __init__(self):
        super().__init__(Attendance)

    def count_for_event(self, db: Session, event_id: int) -> int:
        return db.execute(select(func.count()).select_from(Attendance).where(Attendance.event_id == event_id)).scalar_one()

    def list_for_event(self, db: Session, event_id: int):
        return db.execute(select(Attendance).where(Attendance.event_id == event_id)).scalars().all()

    def get_by_attendee(self, db: Session, attendee_id: int):
        """Get all check-ins for a specific attendee with event details"""
        return db.execute(
            select(Attendance)
            .options(joinedload(Attendance.event))
            .where(Attendance.attendee_id == attendee_id)
            .order_by(Attendance.checked_in_at.desc())
        ).scalars().all()
    def get_by_event_and_user(self, db: Session, event_id: int, user_id: int):
        """Get attendance record for a specific event and user"""
        return db.execute(
            select(Attendance)
            .where(Attendance.event_id == event_id, Attendance.attendee_id == user_id)
        ).scalar_one_or_none()
