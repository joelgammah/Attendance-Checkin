from sqlalchemy.orm import Session
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
