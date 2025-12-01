# tests/unit/test_repository_user.py
from datetime import datetime, timezone
import pytest
from app.repositories.user_repo import UserRepository
from app.models.user import User, UserRole

class TestUserRepository:
    @pytest.fixture
    def repo(self):
        return UserRepository()

    @pytest.fixture
    def create_user(self, db):
        """Helper to create a user with unique email."""
        def _create_user(email: str = None, roles=None):
            if email is None:
                email = f"test{datetime.now().timestamp()}@example.com"
            if roles is None:
                roles = [UserRole.ATTENDEE]
            
            user = User(
                email=email,
                name="Test User",
                password_hash="dummy"
            )
            db.add(user)
            db.flush()  # assign an ID before adding roles
            for role in roles:
                user.add_role(role)
            db.commit()
            db.refresh(user)
            return user
        return _create_user


    def test_get(self, db, repo, create_user):
        user = create_user()
        fetched = repo.get(db, user.id)
        assert fetched is not None
        assert fetched.id == user.id
        assert fetched.email == user.email

    def test_list(self, db, repo, create_user):
        user1 = create_user()
        user2 = create_user()
        users = repo.list(db)
        assert len(users) >= 2
        assert user1 in users
        assert user2 in users

    def test_create(self, db, repo):
        email = f"newuser{datetime.now().timestamp()}@example.com"
        user = repo.create(db, email=email, name="New User", password_hash="dummy")
        assert user.id is not None
        assert user.email == email

    def test_get_by_email(self, db, repo, create_user):
        email = f"unique{datetime.now().timestamp()}@example.com"
        user = create_user(email=email)
        fetched = repo.get_by_email(db, email)
        assert fetched is not None
        assert fetched.id == user.id
        assert fetched.email == email

    def test_delete_user(self, db, create_user, repo):
        user = create_user()
        assert repo.delete(db, user.id) is True
        assert repo.delete(db, 999999) is False

