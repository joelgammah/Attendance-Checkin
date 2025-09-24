from sqlalchemy.orm import Session
from sqlalchemy import select
from datetime import datetime, timezone
from app.repositories.base import BaseRepository
from app.models.event import Event


class EventRepository(BaseRepository[Event]):
    def __init__(self):
        super().__init__(Event)

    def get_by_token(self, db: Session, token: str) -> Event | None:
        return db.execute(select(Event).where(Event.checkin_token == token)).scalar_one_or_none()

    def upcoming_for_organizer(self, db: Session, organizer_id: int):
        now = datetime.now(timezone.utc)
        stmt = select(Event).where(Event.organizer_id == organizer_id, Event.end_time >= now).order_by(Event.start_time)
        return db.execute(stmt).scalars().all()

    def past_for_organizer(self, db: Session, organizer_id: int):
        now = datetime.now(timezone.utc)
        stmt = select(Event).where(Event.organizer_id == organizer_id, Event.end_time < now).order_by(Event.start_time.desc())
        return db.execute(stmt).scalars().all()
