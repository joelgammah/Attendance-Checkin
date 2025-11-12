import jwt
from datetime import datetime, timezone
from app.core import security

from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    ALGORITHM,
)

SECRET_KEY = "testsecret123"


def test_password_hash_and_verify():
    password = "supersecurepassword"
    hashed = get_password_hash(password)

    # basic type + difference
    assert isinstance(hashed, str)
    assert hashed != password

    # should verify correctly
    assert verify_password(password, hashed)

    # wrong password should fail
    assert not verify_password("wrongpassword", hashed)


def test_create_access_token_structure():
    token = create_access_token("user123", SECRET_KEY, expires_minutes=30)

    # token should be a non-empty string
    assert isinstance(token, str)
    assert len(token) > 10

    # decode and validate claims
    decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    assert decoded["sub"] == "user123"

    exp = decoded["exp"]
    assert datetime.fromtimestamp(exp, tz=timezone.utc) > datetime.now(timezone.utc)


def test_token_expiration_is_in_future():
    token = create_access_token("user", SECRET_KEY, expires_minutes=1)
    decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    exp = datetime.fromtimestamp(decoded["exp"], tz=timezone.utc)
    now = datetime.now(timezone.utc)
    assert (exp - now).total_seconds() > 0

def test_verify_password_handles_exceptions(monkeypatch):
    # Patch pwd_context.verify to raise an exception
    from app.core import security

    def mock_verify(*args, **kwargs):
        raise ValueError("Bad hash")

    monkeypatch.setattr(security.pwd_context, "verify", mock_verify)
    assert not security.verify_password("pass", "brokenhash")