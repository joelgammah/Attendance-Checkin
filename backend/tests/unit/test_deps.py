import pytest
from unittest.mock import patch, MagicMock
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User, UserRole


class DummyUser(User):
    def __init__(self, roles=None):
        self.roles = roles or []
        # Add required attributes that get_current_user checks
        self.email = "test@example.com"
        self.name = "Test User"
        self.auth0_sub = None

    def has_any_role(self, roles):
        return any(role in self.roles for role in roles)
    
    def add_role(self, role):
        self.roles.append(role)


@pytest.fixture
def mock_db():
    db = MagicMock(spec=Session)
    return db


# --------------------------
# Test get_db
# --------------------------
def test_get_db_yields_and_closes():
    generator = deps.get_db()
    db = next(generator)
    assert isinstance(db, Session)
    with pytest.raises(StopIteration):
        next(generator)


# --------------------------
# Test get_current_user
# --------------------------
@patch("app.api.deps.jwt.decode")
@patch("app.api.deps.UserRepository")
def test_get_current_user_valid(mock_user_repo_class, mock_jwt, mock_db):
    token = "fake-token"
    mock_jwt.return_value = {"sub": "test@example.com"}
    
    # Create a user instance with required attributes
    user_instance = DummyUser()
    user_instance.email = "test@example.com"
    
    # Mock the UserRepository instance
    mock_repo_instance = MagicMock()
    mock_repo_instance.get_by_email.return_value = user_instance
    mock_user_repo_class.return_value = mock_repo_instance

    user = deps.get_current_user(db=mock_db, token=token)
    assert user == user_instance
    mock_jwt.assert_called_once()
    mock_repo_instance.get_by_email.assert_called_once_with(mock_db, "test@example.com")


@patch("app.api.deps.jwt.decode")
def test_get_current_user_invalid_token(mock_jwt, mock_db):
    token = "invalid-token"
    mock_jwt.side_effect = Exception("Bad token")
    with pytest.raises(HTTPException) as exc:
        deps.get_current_user(db=mock_db, token=token)
    assert exc.value.status_code == 401
    assert "Invalid token" in exc.value.detail


@patch("app.api.deps.jwt.decode")
@patch("app.api.deps.UserRepository")
def test_get_current_user_user_not_found(mock_user_repo_class, mock_jwt, mock_db):
    """Test that a new user is auto-provisioned when not found (Auth0 behavior)"""
    token = "fake-token"
    mock_jwt.return_value = {"sub": "notfound@example.com"}
    
    # Create a new user that will be "created"
    new_user = DummyUser()
    new_user.email = "notfound@example.com"
    new_user.name = "notfound"
    
    # Mock the UserRepository instance
    mock_repo_instance = MagicMock()
    mock_repo_instance.get_by_email.return_value = None  # User not found
    mock_repo_instance.create.return_value = new_user  # User gets created
    mock_user_repo_class.return_value = mock_repo_instance

    # Should auto-provision user instead of raising exception
    user = deps.get_current_user(db=mock_db, token=token)
    
    # Verify user was created
    assert user is not None
    assert user.email == "notfound@example.com"
    mock_repo_instance.create.assert_called_once()
    mock_db.commit.assert_called()
    mock_db.refresh.assert_called_once_with(new_user)


# --------------------------
# Test require_any_role
# --------------------------
def test_require_any_role_user_has_role():
    user = DummyUser(roles=[UserRole.ADMIN])
    dep = deps.require_any_role(UserRole.ADMIN)
    result = dep(current_user=user)
    assert result == user


def test_require_any_role_user_lacks_role():
    user = DummyUser(roles=[UserRole.ATTENDEE])
    dep = deps.require_any_role(UserRole.ADMIN)
    with pytest.raises(HTTPException) as exc:
        dep(current_user=user)
    assert exc.value.status_code == 403
    assert "Forbidden" in exc.value.detail