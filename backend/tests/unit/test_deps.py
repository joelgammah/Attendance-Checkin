import pytest
from unittest.mock import patch, MagicMock
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User, UserRole


class DummyUser(User):
    def __init__(self, roles=None):
        self.roles = roles or []

    def has_any_role(self, roles):
        return any(role in self.roles for role in roles)


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
def test_get_current_user_valid(mock_user_repo, mock_jwt, mock_db):
    token = "fake-token"
    mock_jwt.return_value = {"sub": "test@example.com"}
    user_instance = DummyUser()
    mock_user_repo.return_value.get_by_email.return_value = user_instance

    user = deps.get_current_user(db=mock_db, token=token)
    assert user == user_instance
    mock_jwt.assert_called_once()
    mock_user_repo.return_value.get_by_email.assert_called_once()


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
def test_get_current_user_user_not_found(mock_user_repo, mock_jwt, mock_db):
    token = "fake-token"
    mock_jwt.return_value = {"sub": "notfound@example.com"}
    mock_user_repo.return_value.get_by_email.return_value = None

    with pytest.raises(HTTPException) as exc:
        deps.get_current_user(db=mock_db, token=token)
    assert exc.value.status_code == 401
    assert "User not found" in exc.value.detail


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
