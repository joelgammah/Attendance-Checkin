import pytest
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.repositories.event_member_repo import EventMemberRepository
from app.models.event_member import EventMember
from app.models.event import Event
from app.models.user import User
from app.models.attendance import Attendance


class TestEventMemberRepository:
    @pytest.fixture
    def repo(self):
        return EventMemberRepository()

    @pytest.fixture
    def users_and_event(self, db: Session):
        """Create test users and event"""
        user1 = User(email="user1@test.com", name="User 1", password_hash="hash")
        user2 = User(email="user2@test.com", name="User 2", password_hash="hash")
        user3 = User(email="user3@test.com", name="User 3", password_hash="hash")
        db.add_all([user1, user2, user3])
        db.commit()
        db.refresh(user1)
        db.refresh(user2)
        db.refresh(user3)

        event = Event(
            name="Test Event",
            location="Test Location",
            start_time=datetime.now(timezone.utc),
            end_time=datetime.now(timezone.utc),
            organizer_id=user3.id,
            checkin_token="token123",
        )
        db.add(event)
        db.commit()
        db.refresh(event)

        return user1, user2, user3, event

    def test_add_member(self, db: Session, repo, users_and_event):
        user1, user2, user3, event = users_and_event
        
        member = repo.add_member(db, event.id, user1.id)
        db.commit()
        
        assert member.event_id == event.id
        assert member.user_id == user1.id
        assert isinstance(member, EventMember)

    def test_is_member_true(self, db: Session, repo, users_and_event):
        user1, user2, user3, event = users_and_event
        repo.add_member(db, event.id, user1.id)
        db.commit()
        
        assert repo.is_member(db, event.id, user1.id) is True

    def test_is_member_false(self, db: Session, repo, users_and_event):
        user1, user2, user3, event = users_and_event
        
        assert repo.is_member(db, event.id, user1.id) is False

    def test_list_members(self, db: Session, repo, users_and_event):
        user1, user2, user3, event = users_and_event
        repo.add_member(db, event.id, user1.id)
        repo.add_member(db, event.id, user2.id)
        db.commit()
        
        members = repo.list_members(db, event.id)
        assert len(members) == 2
        assert any(m.user_id == user1.id for m in members)
        assert any(m.user_id == user2.id for m in members)

    def test_list_members_empty(self, db: Session, repo, users_and_event):
        user1, user2, user3, event = users_and_event
        
        members = repo.list_members(db, event.id)
        assert len(members) == 0

    def test_remove_member(self, db: Session, repo, users_and_event):
        user1, user2, user3, event = users_and_event
        repo.add_member(db, event.id, user1.id)
        db.commit()
        
        repo.remove_member(db, event.id, user1.id)
        db.commit()
        
        assert repo.is_member(db, event.id, user1.id) is False

    def test_remove_member_nonexistent(self, db: Session, repo, users_and_event):
        user1, user2, user3, event = users_and_event
        
        # Should not raise an error
        repo.remove_member(db, event.id, user1.id)
        db.commit()
        
        assert repo.is_member(db, event.id, user1.id) is False

    def test_get_events_for_user(self, db: Session, repo, users_and_event):
        user1, user2, user3, event = users_and_event
        event2 = Event(
            name="Event 2",
            location="Location 2",
            start_time=datetime.now(timezone.utc),
            end_time=datetime.now(timezone.utc),
            organizer_id=user3.id,
            checkin_token="token456",
        )
        db.add(event2)
        db.commit()
        db.refresh(event2)
        
        repo.add_member(db, event.id, user1.id)
        repo.add_member(db, event2.id, user1.id)
        db.commit()
        
        events = repo.get_events_for_user(db, user1.id)
        assert len(events) == 2
        assert any(e.event_id == event.id for e in events)
        assert any(e.event_id == event2.id for e in events)

    def test_get_member_attendance_count_recurring_series(self, db: Session, repo, users_and_event):
        user1, user2, user3, event = users_and_event
        
        # Create parent event
        parent = Event(
            name="Parent Event",
            location="Location",
            start_time=datetime.now(timezone.utc),
            end_time=datetime.now(timezone.utc),
            organizer_id=user3.id,
            checkin_token="parent_token",
            recurring=True,
        )
        db.add(parent)
        db.commit()
        db.refresh(parent)
        
        # Create child event with parent_id
        child = Event(
            name="Child Event",
            location="Location",
            start_time=datetime.now(timezone.utc),
            end_time=datetime.now(timezone.utc),
            organizer_id=user3.id,
            checkin_token="child_token",
            parent_id=parent.id,
        )
        db.add(child)
        db.commit()
        db.refresh(child)
        
        repo.add_member(db, parent.id, user1.id)
        db.commit()
        
        # Create attendance for child event
        att = Attendance(
            event_id=child.id, 
            attendee_id=user1.id, 
            checked_in_at=datetime.now(timezone.utc)
        )
        db.add(att)
        db.commit()
        
        # Count should include attendance from child event when querying from parent
        count = repo.get_member_attendance_count(db, parent.id, user1.id)
        assert count == 1
        
        # Count should also work when querying from child
        count_from_child = repo.get_member_attendance_count(db, child.id, user1.id)
        assert count_from_child == 1

    def test_get_member_attendance_count_nonexistent_event(self, db: Session, repo):
        count = repo.get_member_attendance_count(db, 9999, 1)
        assert count == 0

    def test_list_members_for_parent(self, db: Session, repo, users_and_event):
        user1, user2, user3, event = users_and_event
        repo.add_member(db, event.id, user1.id)
        repo.add_member(db, event.id, user2.id)
        db.commit()
        
        members = repo.list_members_for_parent(db, event.id)
        assert len(members) == 2
        assert any(m.user_id == user1.id for m in members)
        assert any(m.user_id == user2.id for m in members)
