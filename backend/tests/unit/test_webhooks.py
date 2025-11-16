import asyncio
import pytest
from unittest.mock import MagicMock, patch
from fastapi import HTTPException

from app.api import webhooks


def test_auth0_user_deleted_found_by_sub(monkeypatch):
    mock_db = MagicMock()

    # Mock user returned when searching by auth0_sub
    user = MagicMock()
    user.id = 123
    user.email = "user@example.com"

    mock_repo = MagicMock()
    mock_repo.get_by_auth0_sub.return_value = user

    # Patch the UserRepository to return our mock_repo instance
    monkeypatch.setattr(webhooks, "UserRepository", lambda: mock_repo)

    payload = webhooks.Auth0UserDeletedPayload(auth0_sub="auth0|123")
    request = MagicMock()

    result = asyncio.run(webhooks.auth0_user_deleted(payload, request, db=mock_db))

    # delete should be called with db and user.id, commit called, and proper response returned
    mock_repo.delete.assert_called_once_with(mock_db, 123)
    mock_db.commit.assert_called_once()
    assert result["status"] == "success"
    assert result["deleted_user_id"] == 123


def test_auth0_user_deleted_found_by_email(monkeypatch):
    mock_db = MagicMock()

    # No user found by auth0_sub, but found by email
    mock_repo = MagicMock()
    mock_repo.get_by_auth0_sub.return_value = None
    user = MagicMock()
    user.id = 456
    user.email = "legacy@example.com"
    mock_repo.get_by_email.return_value = user

    monkeypatch.setattr(webhooks, "UserRepository", lambda: mock_repo)

    payload = webhooks.Auth0UserDeletedPayload(auth0_sub="auth0|456")
    request = MagicMock()

    result = asyncio.run(webhooks.auth0_user_deleted(payload, request, db=mock_db))

    mock_repo.delete.assert_called_once_with(mock_db, 456)
    mock_db.commit.assert_called_once()
    assert result["status"] == "success"
    assert result["deleted_user_id"] == 456


def test_auth0_user_deleted_user_not_found(monkeypatch):
    mock_db = MagicMock()

    mock_repo = MagicMock()
    mock_repo.get_by_auth0_sub.return_value = None
    mock_repo.get_by_email.return_value = None

    monkeypatch.setattr(webhooks, "UserRepository", lambda: mock_repo)

    payload = webhooks.Auth0UserDeletedPayload(auth0_sub="auth0|nope")
    request = MagicMock()

    result = asyncio.run(webhooks.auth0_user_deleted(payload, request, db=mock_db))

    # Should not attempt to delete or commit
    mock_repo.delete.assert_not_called()
    mock_db.commit.assert_not_called()
    assert result["status"] == "user_not_found"


def test_auth0_user_deleted_delete_raises_and_rolls_back(monkeypatch):
    mock_db = MagicMock()

    user = MagicMock()
    user.id = 999
    user.email = "err@example.com"

    mock_repo = MagicMock()
    mock_repo.get_by_auth0_sub.return_value = user
    # delete raises an exception to trigger the except branch
    def _raise(db, uid):
        raise RuntimeError("delete failed")

    mock_repo.delete.side_effect = _raise

    monkeypatch.setattr(webhooks, "UserRepository", lambda: mock_repo)

    payload = webhooks.Auth0UserDeletedPayload(auth0_sub="auth0|999")
    request = MagicMock()

    with pytest.raises(HTTPException) as exc:
        asyncio.run(webhooks.auth0_user_deleted(payload, request, db=mock_db))

    assert exc.value.status_code == 500
    mock_db.rollback.assert_called_once()
