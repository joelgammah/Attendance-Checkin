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
@patch("app.api.deps.verify_hs256_token")
@patch("app.api.deps.verify_auth0_token")
@patch("app.api.deps.UserRepository")
def test_get_current_user_valid(mock_user_repo_class, mock_verify_auth0, mock_verify_hs256, mock_db):
    token = "fake-token"
    # Simulate Auth0 validation failing so code falls back to HS256
    mock_verify_auth0.side_effect = ValueError("Auth0 not available")
    mock_verify_hs256.return_value = {"email": "test@example.com"}

    # Create a user instance with required attributes
    user_instance = DummyUser()
    user_instance.email = "test@example.com"

    # Mock the UserRepository instance
    mock_repo_instance = MagicMock()
    mock_repo_instance.get_by_email.return_value = user_instance
    mock_user_repo_class.return_value = mock_repo_instance

    user = deps.get_current_user(db=mock_db, token=token)
    assert user == user_instance
    mock_verify_hs256.assert_called_once()
    mock_repo_instance.get_by_email.assert_called_once_with(mock_db, "test@example.com")


@patch("app.api.deps.verify_hs256_token")
@patch("app.api.deps.verify_auth0_token")
def test_get_current_user_invalid_token(mock_verify_auth0, mock_verify_hs256, mock_db):
    token = "invalid-token"
    # Auth0 validation fails, HS256 validation also fails
    mock_verify_auth0.side_effect = ValueError("Auth0 not available")
    mock_verify_hs256.side_effect = ValueError("Invalid HS256 token")
    with pytest.raises(HTTPException) as exc:
        deps.get_current_user(db=mock_db, token=token)
    assert exc.value.status_code == 401
    assert "Invalid token" in exc.value.detail


@patch("app.api.deps.verify_hs256_token")
@patch("app.api.deps.verify_auth0_token")
@patch("app.api.deps.UserRepository")
def test_get_current_user_user_not_found(mock_user_repo_class, mock_verify_auth0, mock_verify_hs256, mock_db):
    """Test that a new user is auto-provisioned when not found (Auth0 behavior)"""
    token = "fake-token"
    # Force fallback to HS256
    mock_verify_auth0.side_effect = ValueError("Auth0 not available")
    mock_verify_hs256.return_value = {"email": "notfound@example.com"}

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


# --------------------------
# Additional tests to cover Auth0/HS256 branches in deps.py
# --------------------------
def test_get_current_user_auth0_updates_email_and_name(monkeypatch, mock_db):
    # Arrange: simulate Auth0 configured and returning actual_email / actual_name / auth0_sub
    monkeypatch.setattr(deps.settings, "AUTH0_DOMAIN", "tenant.example.com")
    monkeypatch.setattr(deps.settings, "AUTH0_AUDIENCE", "audience")

    token = "auth0-token"
    auth0_payload = {
        "email": "real@example.com",
        "actual_email": "real@example.com",
        "actual_name": "Real Name",
        "auth0_sub": "auth0|abc123",
    }

    with patch("app.api.deps.verify_auth0_token", return_value=auth0_payload):
        # existing user stored with auth0| prefixed email (legacy auto-provisioned)
        existing = MagicMock()
        existing.email = "auth0|abc123"
        existing.name = "auth0|abc123"
        existing.auth0_sub = None

        mock_repo = MagicMock()
        mock_repo.get_by_email.return_value = existing
        with patch("app.api.deps.UserRepository", return_value=mock_repo):
            user = deps.get_current_user(db=mock_db, token=token)

    assert user.email == "real@example.com"
    assert user.name == "Real Name"
    mock_db.commit.assert_called()
    mock_db.refresh.assert_called_once_with(existing)


def test_get_current_user_auth0_improves_display_name(monkeypatch, mock_db):
    monkeypatch.setattr(deps.settings, "AUTH0_DOMAIN", "tenant.example.com")
    monkeypatch.setattr(deps.settings, "AUTH0_AUDIENCE", "audience")

    token = "auth0-token"
    auth0_payload = {
        "email": None,
        "actual_email": None,
        "actual_name": "Nice Name",
        "auth0_sub": "auth0|deadbeef",
    }

    with patch("app.api.deps.verify_auth0_token", return_value=auth0_payload):
        existing = MagicMock()
        existing.email = "auth0|deadbeef"
        existing.name = "auth0|deadbeef"
        existing.auth0_sub = None

        mock_repo = MagicMock()
        mock_repo.get_by_email.return_value = existing
        with patch("app.api.deps.UserRepository", return_value=mock_repo):
            user = deps.get_current_user(db=mock_db, token=token)

    # Should have improved name (actual_name present), and committed/refreshed
    assert user.name == "Nice Name"
    mock_db.commit.assert_called()
    mock_db.refresh.assert_called_once_with(existing)


def test_get_current_user_adds_auth0_sub_when_missing(monkeypatch, mock_db):
    monkeypatch.setattr(deps.settings, "AUTH0_DOMAIN", "tenant.example.com")
    monkeypatch.setattr(deps.settings, "AUTH0_AUDIENCE", "audience")

    token = "auth0-token"
    auth0_payload = {
        "email": None,
        "actual_email": None,
        "actual_name": None,
        "auth0_sub": "auth0|feedface",
    }

    with patch("app.api.deps.verify_auth0_token", return_value=auth0_payload):
        existing = MagicMock()
        existing.email = "someone@example.com"
        existing.name = "Someone"
        existing.auth0_sub = None

        mock_repo = MagicMock()
        mock_repo.get_by_email.return_value = existing
        with patch("app.api.deps.UserRepository", return_value=mock_repo):
            user = deps.get_current_user(db=mock_db, token=token)

    assert user.auth0_sub == "auth0|feedface"
    mock_db.commit.assert_called()
    mock_db.refresh.assert_called_once_with(existing)


def test_get_current_user_no_auth0_uses_hs256(monkeypatch, mock_db):
    # Ensure Auth0 is disabled in settings
    monkeypatch.setattr(deps.settings, "AUTH0_DOMAIN", "")
    monkeypatch.setattr(deps.settings, "AUTH0_AUDIENCE", "")

    token = "hs256-token"

    with patch("app.api.deps.verify_hs256_token", return_value={"email": "local@example.com"}):
        user_inst = DummyUser()
        user_inst.email = "local@example.com"
        mock_repo = MagicMock()
        mock_repo.get_by_email.return_value = user_inst
        with patch("app.api.deps.UserRepository", return_value=mock_repo):
            user = deps.get_current_user(db=mock_db, token=token)

    assert user.email == "local@example.com"
    mock_repo.get_by_email.assert_called_once_with(mock_db, "local@example.com")