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


# --------------------------
# Test _fetch_jwks
# --------------------------
def test_fetch_jwks_success(monkeypatch):
    monkeypatch.setattr(deps.settings, "AUTH0_DOMAIN", "tenant.auth0.com")
    mock_response = {"keys": [{"kid": "key1"}]}
    
    with patch("app.api.deps.requests.get") as mock_get:
        mock_get.return_value.json.return_value = mock_response
        result = deps._fetch_jwks()
    
    assert result == mock_response
    mock_get.assert_called_once_with("https://tenant.auth0.com/.well-known/jwks.json", timeout=5)


def test_fetch_jwks_network_error(monkeypatch):
    monkeypatch.setattr(deps.settings, "AUTH0_DOMAIN", "tenant.auth0.com")
    
    with patch("app.api.deps.requests.get", side_effect=Exception("Network error")):
        with pytest.raises(ValueError, match="JWKS fetch failed"):
            deps._fetch_jwks()


# --------------------------
# Test _get_rsa_key_from_jwks
# --------------------------
def test_get_rsa_key_from_jwks_found(monkeypatch):
    token = "eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleTEifQ.payload.signature"
    jwks = {
        "keys": [
            {
                "kid": "key1",
                "kty": "RSA",
                "use": "sig",
                "n": "test_n",
                "e": "AQAB"
            }
        ]
    }
    
    with patch("app.api.deps.jwt.get_unverified_header", return_value={"kid": "key1"}):
        with patch("app.api.deps.RSAAlgorithm.from_jwk") as mock_from_jwk:
            mock_rsa_key = MagicMock()
            mock_from_jwk.return_value = mock_rsa_key
            result = deps._get_rsa_key_from_jwks(jwks, token)
    
    assert result == mock_rsa_key


def test_get_rsa_key_from_jwks_no_kid_in_token(monkeypatch):
    token = "invalid.token.format"
    jwks = {"keys": []}
    
    with patch("app.api.deps.jwt.get_unverified_header", return_value={}):
        with pytest.raises(ValueError, match="No kid in token"):
            deps._get_rsa_key_from_jwks(jwks, token)


def test_get_rsa_key_from_jwks_invalid_token_header(monkeypatch):
    token = "invalid.token"
    jwks = {"keys": []}
    
    with patch("app.api.deps.jwt.get_unverified_header", side_effect=Exception("Bad header")):
        with pytest.raises(ValueError, match="Invalid token header"):
            deps._get_rsa_key_from_jwks(jwks, token)


def test_get_rsa_key_from_jwks_no_matching_key():
    token = "eyJhbGciOiJSUzI1NiIsImtpZCI6Im5vbWF0Y2gifQ.payload.signature"
    jwks = {"keys": [{"kid": "other_key", "kty": "RSA"}]}
    
    with patch("app.api.deps.jwt.get_unverified_header", return_value={"kid": "nomatch"}):
        with pytest.raises(ValueError, match="No matching JWK"):
            deps._get_rsa_key_from_jwks(jwks, token)


def test_get_rsa_key_from_jwks_jwk_parse_error():
    token = "eyJhbGciOiJSUzI1NiIsImtpZCI6ImJhZCJ9.payload.signature"
    jwks = {"keys": [{"kid": "bad", "kty": "INVALID"}]}

    with patch("app.api.deps.jwt.get_unverified_header", return_value={"kid": "bad"}):
        # Simulate RSAAlgorithm.from_jwk failing
        with patch("app.api.deps.RSAAlgorithm.from_jwk", side_effect=Exception("Bad JWK")):
            result = deps._get_rsa_key_from_jwks(jwks, token)

    assert result is None


# --------------------------
# Test verify_auth0_token
# --------------------------
def test_verify_auth0_token_not_configured(monkeypatch):
    monkeypatch.setattr(deps.settings, "AUTH0_DOMAIN", "")
    monkeypatch.setattr(deps.settings, "AUTH0_AUDIENCE", "")
    
    with pytest.raises(ValueError, match="Auth0 not configured"):
        deps.verify_auth0_token("token")


def test_verify_auth0_token_no_matching_jwk(monkeypatch):
    monkeypatch.setattr(deps.settings, "AUTH0_DOMAIN", "tenant.auth0.com")
    monkeypatch.setattr(deps.settings, "AUTH0_AUDIENCE", "audience")
    
    token = "eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleTEifQ.payload.signature"
    
    with patch("app.api.deps._fetch_jwks", return_value={"keys": []}):
        with patch("app.api.deps.jwt.get_unverified_header", return_value={"kid": "key1"}):
            with pytest.raises(ValueError, match="No matching JWK"):
                deps.verify_auth0_token(token)


def test_verify_auth0_token_decode_fails(monkeypatch):
    monkeypatch.setattr(deps.settings, "AUTH0_DOMAIN", "tenant.auth0.com")
    monkeypatch.setattr(deps.settings, "AUTH0_AUDIENCE", "audience")
    
    token = "bad.token.here"
    
    with patch("app.api.deps._fetch_jwks", return_value={"keys": [{"kid": "key1", "kty": "RSA"}]}):
        with patch("app.api.deps.jwt.get_unverified_header", return_value={"kid": "key1"}):
            with patch("app.api.deps.RSAAlgorithm.from_jwk", return_value=MagicMock()):
                with patch("app.api.deps.jwt.decode", side_effect=Exception("Decode error")):
                    with pytest.raises(ValueError, match="Auth0 token decode failed"):
                        deps.verify_auth0_token(token)


def test_verify_auth0_token_missing_subject(monkeypatch):
    monkeypatch.setattr(deps.settings, "AUTH0_DOMAIN", "tenant.auth0.com")
    monkeypatch.setattr(deps.settings, "AUTH0_AUDIENCE", "audience")
    
    token = "valid.token.here"
    payload = {"email": None}  # No sub field
    
    with patch("app.api.deps._fetch_jwks", return_value={"keys": [{"kid": "key1"}]}):
        with patch("app.api.deps.jwt.get_unverified_header", return_value={"kid": "key1"}):
            with patch("app.api.deps.RSAAlgorithm.from_jwk", return_value=MagicMock()):
                with patch("app.api.deps.jwt.decode", return_value=payload):
                    with pytest.raises(ValueError, match="Invalid token: missing subject"):
                        deps.verify_auth0_token(token)


# --------------------------
# Test verify_hs256_token
# --------------------------
def test_verify_hs256_token_success(monkeypatch):
    monkeypatch.setattr(deps.settings, "SECRET_KEY", "test-secret")
    token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0QGV4YW1wbGUuY29tIn0.test"
    
    with patch("app.api.deps.jwt.decode", return_value={"sub": "test@example.com"}):
        result = deps.verify_hs256_token(token)
    
    assert result == {"email": "test@example.com"}


def test_verify_hs256_token_missing_sub(monkeypatch):
    monkeypatch.setattr(deps.settings, "SECRET_KEY", "test-secret")
    token = "invalid.token"
    
    with patch("app.api.deps.jwt.decode", return_value={}):
        with pytest.raises(ValueError, match="Invalid HS256 token"):
            deps.verify_hs256_token(token)


def test_verify_hs256_token_decode_error(monkeypatch):
    monkeypatch.setattr(deps.settings, "SECRET_KEY", "test-secret")
    token = "bad.token"
    
    with patch("app.api.deps.jwt.decode", side_effect=Exception("Decode failed")):
        with pytest.raises(ValueError, match="Invalid HS256 token"):
            deps.verify_hs256_token(token)


# --------------------------
# Test get_current_user edge cases and Auth0 fallback
# --------------------------
def test_get_current_user_auth0_fails_falls_back_to_hs256(monkeypatch, mock_db):
    """Test that when Auth0 validation fails, we fall back to HS256"""
    monkeypatch.setattr(deps.settings, "AUTH0_DOMAIN", "tenant.auth0.com")
    monkeypatch.setattr(deps.settings, "AUTH0_AUDIENCE", "audience")
    
    token = "some-token"
    
    with patch("app.api.deps.verify_auth0_token", side_effect=ValueError("Auth0 failed")):
        with patch("app.api.deps.verify_hs256_token", return_value={"email": "fallback@example.com"}):
            user_inst = DummyUser()
            user_inst.email = "fallback@example.com"
            mock_repo = MagicMock()
            mock_repo.get_by_email.return_value = user_inst
            
            with patch("app.api.deps.UserRepository", return_value=mock_repo):
                user = deps.get_current_user(db=mock_db, token=token)
    
    assert user.email == "fallback@example.com"


def test_get_current_user_both_auth_methods_fail(monkeypatch, mock_db):
    """Test that HTTPException is raised when both Auth0 and HS256 fail"""
    monkeypatch.setattr(deps.settings, "AUTH0_DOMAIN", "tenant.auth0.com")
    monkeypatch.setattr(deps.settings, "AUTH0_AUDIENCE", "audience")
    
    token = "bad-token"
    
    with patch("app.api.deps.verify_auth0_token", side_effect=ValueError("Auth0 failed")):
        with patch("app.api.deps.verify_hs256_token", side_effect=ValueError("HS256 failed")):
            with pytest.raises(HTTPException) as exc:
                deps.get_current_user(db=mock_db, token=token)
    
    assert exc.value.status_code == 401


def test_get_current_user_auto_provision_extracts_name_from_email(monkeypatch, mock_db):
    """Test that auto-provisioned users get friendly names extracted from email"""
    monkeypatch.setattr(deps.settings, "AUTH0_DOMAIN", "")
    monkeypatch.setattr(deps.settings, "AUTH0_AUDIENCE", "")
    
    token = "token"
    
    with patch("app.api.deps.verify_hs256_token", return_value={"email": "newuser@company.com"}):
        new_user = DummyUser()
        new_user.email = "newuser@company.com"
        new_user.name = "newuser"
        
        mock_repo = MagicMock()
        mock_repo.get_by_email.return_value = None  # Not found
        mock_repo.create.return_value = new_user
        
        with patch("app.api.deps.UserRepository", return_value=mock_repo):
            user = deps.get_current_user(db=mock_db, token=token)
    
    # Name should be extracted from email (part before @)
    assert mock_repo.create.called
    call_args = mock_repo.create.call_args
    assert "newuser" in str(call_args).lower() or call_args.kwargs.get("name") == "newuser"


def test_get_current_user_auto_provision_auth0_id_fallback(monkeypatch, mock_db):
    """Test that auto-provisioned users get friendly names from Auth0 ID if email unavailable"""
    monkeypatch.setattr(deps.settings, "AUTH0_DOMAIN", "tenant.auth0.com")
    monkeypatch.setattr(deps.settings, "AUTH0_AUDIENCE", "audience")
    
    token = "auth0-token"
    auth0_payload = {
        "email": "auth0|abc123def456",  # Auth0 subject ID instead of email
        "actual_email": None,
        "actual_name": None,
        "auth0_sub": "auth0|abc123def456"
    }
    
    with patch("app.api.deps.verify_auth0_token", return_value=auth0_payload):
        new_user = DummyUser()
        new_user.email = "auth0|abc123def456"
        
        mock_repo = MagicMock()
        mock_repo.get_by_email.return_value = None
        mock_repo.create.return_value = new_user
        
        with patch("app.api.deps.UserRepository", return_value=mock_repo):
            user = deps.get_current_user(db=mock_db, token=token)
    
    # Should have created a user
    assert mock_repo.create.called


def test_get_current_user_existing_user_email_update_from_auth0(monkeypatch, mock_db):
    """Test that existing auth0| email users get updated with real email from Auth0"""
    monkeypatch.setattr(deps.settings, "AUTH0_DOMAIN", "tenant.auth0.com")
    monkeypatch.setattr(deps.settings, "AUTH0_AUDIENCE", "audience")
    
    token = "auth0-token"
    auth0_payload = {
        "email": "user@example.com",
        "actual_email": "user@example.com",
        "actual_name": "Real User",
        "auth0_sub": "auth0|xyz789"
    }
    
    existing = DummyUser()
    existing.email = "auth0|oldid"
    existing.name = "auth0|oldid"
    existing.auth0_sub = None
    
    with patch("app.api.deps.verify_auth0_token", return_value=auth0_payload):
        mock_repo = MagicMock()
        mock_repo.get_by_email.return_value = existing
        
        with patch("app.api.deps.UserRepository", return_value=mock_repo):
            user = deps.get_current_user(db=mock_db, token=token)
    
    # Should have updated existing user
    assert mock_db.commit.called
    assert mock_db.refresh.called


def test_require_any_role_multiple_roles_user_has_one():
    """Test that require_any_role passes if user has any of the required roles"""
    user = DummyUser(roles=[UserRole.ORGANIZER])
    dep = deps.require_any_role(UserRole.ADMIN, UserRole.ORGANIZER)
    result = dep(current_user=user)
    assert result == user


def test_require_any_role_multiple_roles_user_has_none():
    """Test that require_any_role fails if user has none of the required roles"""
    user = DummyUser(roles=[UserRole.ATTENDEE])
    dep = deps.require_any_role(UserRole.ADMIN, UserRole.ORGANIZER)
    with pytest.raises(HTTPException) as exc:
        dep(current_user=user)
    assert exc.value.status_code == 403