import pytest
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.repositories.event_repo import EventRepository
from app.models.event import Event
from app.models.user import User, UserRole

class TestEventRepository:
    @pytest.fixture
    def repo(self):
        return EventRepository()

    def create_user(self, db: Session, email="organizer@example.com"):
        user = User(
            email=email,
            name="Organizer",
            password_hash="dummy",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    def create_event(self, db: Session, organizer_id, token=None, start_offset=0, end_offset=1):
        """Create an event with start/end time relative to now."""
        now = datetime.now(timezone.utc)
        if token is None:
            # Generate a unique token per event
            token = f"token-{now.timestamp()}-{start_offset}-{end_offset}"
        event = Event(
            name="Test Event",
            location="Test Location",
            start_time=now + timedelta(days=start_offset),
            end_time=now + timedelta(days=end_offset),
            organizer_id=organizer_id,
            checkin_token=token
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        return event

    def test_get_by_token(self, db: Session, repo):
        user = self.create_user(db)
        event = self.create_event(db, user.id, token="unique-token")

        fetched = repo.get_by_token(db, "unique-token")
        assert fetched is not None
        assert fetched.id == event.id

        # Should return None if token doesn't exist
        assert repo.get_by_token(db, "nonexistent") is None

    def test_upcoming_for_organizer(self, db: Session, repo):
        user = self.create_user(db)
        past_event = self.create_event(db, user.id, start_offset=-5, end_offset=-1)
        upcoming_event1 = self.create_event(db, user.id, start_offset=1, end_offset=2)
        upcoming_event2 = self.create_event(db, user.id, start_offset=3, end_offset=4)

        events = repo.upcoming_for_organizer(db, user.id)
        assert len(events) == 2
        assert events[0].id == upcoming_event1.id
        assert events[1].id == upcoming_event2.id

    def test_past_for_organizer(self, db: Session, repo):
        user = self.create_user(db)
        past_event1 = self.create_event(db, user.id, start_offset=-5, end_offset=-4)
        past_event2 = self.create_event(db, user.id, start_offset=-3, end_offset=-2)
        future_event = self.create_event(db, user.id, start_offset=1, end_offset=2)

        events = repo.past_for_organizer(db, user.id)
        assert len(events) == 2
        # Past events should be in descending order of start_time
        assert events[0].id == past_event2.id
        assert events[1].id == past_event1.id
