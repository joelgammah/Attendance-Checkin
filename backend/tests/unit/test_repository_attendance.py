import pytest
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.repositories.attendance_repo import AttendanceRepository
from app.models.attendance import Attendance
from app.models.event import Event
from app.models.user import User, UserRole

class TestAttendanceRepository:
    @pytest.fixture
    def repo(self):
        return AttendanceRepository()

    def test_count_for_event(self, db: Session, repo):
        # Create and persist a user
        user1 = User(
            email="test@example.com",
            name="Test User",
            password_hash="dummy",  # supply required columns
        )
        user2 = User(
            email="test2@example.com",
            name="Test User 2",
            password_hash="dummy",  # supply required columns
        )
        user3 = User(
            email="test3@example.com",
            name="Test User 3",
            password_hash="dummy",  # supply required columns
        )
        db.add_all([user1, user2, user3])
        db.commit()
        db.refresh(user1)
        db.refresh(user2)
        db.refresh(user3)

        # Create and persist an event
        event = Event(
            name="Test Event",
            location="Test Location",
            start_time=datetime.now(timezone.utc),
            end_time=datetime.now(timezone.utc),
            organizer_id=user3.id,
            checkin_token="test123"
        )
        db.add(event)
        db.commit()
        db.refresh(event)

        # Create attendances referencing the persisted ids
        attendance1 = Attendance(event_id=event.id, attendee_id=user1.id, checked_in_at=datetime.now(timezone.utc))
        attendance2 = Attendance(event_id=event.id, attendee_id=user2.id, checked_in_at=datetime.now(timezone.utc))
        db.add_all([attendance1, attendance2])
        db.commit()

        # Test the count method
        count = repo.count_for_event(db, event.id)
        assert count == 2

    def test_list_for_event_empty(self, db: Session, repo):
        user = User(
            email="test2@example.com",
            name="Test User 2",
            password_hash="dummy",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        event = Event(
            name="Empty Event",
            location="Test Location",
            start_time=datetime.now(timezone.utc),
            end_time=datetime.now(timezone.utc),
            organizer_id=user.id,
            checkin_token="test456"
        )
        db.add(event)
        db.commit()
        db.refresh(event)

        attendances = repo.list_for_event(db, event.id)
        assert len(attendances) == 0

    def test_get_by_attendee(self, db: Session, repo):
        user = User(
            email="test3@example.com",
            name="Test User 3",
            password_hash="dummy",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        event = Event(
            name="Test Event 3",
            location="Test Location",
            start_time=datetime.now(timezone.utc),
            end_time=datetime.now(timezone.utc),
            organizer_id=user.id,
            checkin_token="test789"
        )
        db.add(event)
        db.commit()
        db.refresh(event)

        attendance = Attendance(event_id=event.id, attendee_id=user.id, checked_in_at=datetime.now(timezone.utc))
        db.add(attendance)
        db.commit()

        attendances = repo.get_by_attendee(db, user.id)
        assert len(attendances) == 1
        assert isinstance(attendances[0], Attendance)
        assert attendances[0].event is not None
        assert attendances[0].event.id == event.id