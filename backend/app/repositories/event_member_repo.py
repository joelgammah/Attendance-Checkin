from sqlalchemy.orm import Session
from sqlalchemy import select
from app.repositories.base import BaseRepository
from app.models.event_member import EventMember
from app.models.event import Event

class EventMemberRepository(BaseRepository[EventMember]):
    def __init__(self):
        super().__init__(EventMember)

    def add_member(self, db: Session, event_id: int, user_id: int) -> EventMember:
        """Add a user as a member of an event"""
        member = EventMember(event_id=event_id, user_id=user_id)
        db.add(member)
        db.flush()
        return member

    def remove_member(self, db: Session, event_id: int, user_id: int) -> None:
        """Remove a user from event members"""
        member = db.execute(
            select(EventMember).where(
                (EventMember.event_id == event_id) & 
                (EventMember.user_id == user_id)
            )
        ).scalars().first()
        if member:
            db.delete(member)

    def list_members(self, db: Session, event_id: int):
        """Get all members of an event"""
        return db.execute(
            select(EventMember).where(EventMember.event_id == event_id)
        ).scalars().all()

    def get_events_for_user(self, db: Session, user_id: int):
        """Get all events a user is a member of"""
        return db.execute(
            select(EventMember).where(EventMember.user_id == user_id)
        ).scalars().all()

    def is_member(self, db: Session, event_id: int, user_id: int) -> bool:
        """Check if user is a member of event"""
        member = db.execute(
            select(EventMember).where(
                (EventMember.event_id == event_id) & 
                (EventMember.user_id == user_id)
            )
        ).scalars().first()
        return member is not None

    def get_member_attendance_count(self, db: Session, event_id: int, user_id: int) -> int:
        """Get number of times a user attended events in a recurring series"""
        from app.models.attendance import Attendance
        from sqlalchemy import func
        
        # Get parent event if this is a child, otherwise use this event
        event = db.get(Event, event_id)
        if not event:
            return 0
            
        parent_id = event.parent_id if event.parent_id else event_id
        
        # Count attendances for all events in the recurring series
        count = db.execute(
            select(func.count(Attendance.id)).select_from(Attendance).join(
                Event, Attendance.event_id == Event.id
            ).where(
                ((Event.id == parent_id) | (Event.parent_id == parent_id)) &
                (Attendance.attendee_id == user_id)
            )
        ).scalar_one()
        return count or 0
    
    def list_members_for_parent(self, db: Session, parent_id: int):
        """Parent defines the membership list for the entire series."""
        return db.execute(
            select(EventMember).where(EventMember.event_id == parent_id)
        ).scalars().all()
