import os
from unittest.mock import patch
from starlette.testclient import TestClient
from app.models.user import UserRole


def _auth_header(token_admin: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token_admin}"}


@patch("app.api.v1.users.AuditLogRepository.log_audit")
def test_user_actions_require_comment_when_not_testing(mock_audit, client: TestClient, token_admin: str):
    # Ensure TESTING is disabled and enforcement is enabled for this test
    prev_testing = os.environ.get("TESTING")
    prev_enforce = os.environ.get("ENFORCE_COMMENT")
    os.environ["TESTING"] = "false"
    os.environ["ENFORCE_COMMENT"] = "true"

    h = _auth_header(token_admin)

    # Create a user to operate on
    payload = {"name": "ReqCmt User", "email": "reqcmt@example.com", "password": "pass123", "roles": [UserRole.ATTENDEE]}
    r = client.post("/api/v1/users/", json=payload, headers=h)
    assert r.status_code == 201
    user_id = r.json()["id"]

    try:
        # Promote without comment -> should fail (400)
        r_promote_no_comment = client.post(f"/api/v1/users/{user_id}/promote", headers=h)
        assert r_promote_no_comment.status_code == 400

        # Promote with comment -> should pass (200)
        r_promote_with_comment = client.post(f"/api/v1/users/{user_id}/promote?comment=Adding%20context", headers=h)
        assert r_promote_with_comment.status_code == 200

        # Revoke without comment -> should fail (400)
        r_revoke_no_comment = client.post(f"/api/v1/users/{user_id}/revoke-organizer", headers=h)
        assert r_revoke_no_comment.status_code == 400

        # Revoke with comment -> should pass (200)
        r_revoke_with_comment = client.post(f"/api/v1/users/{user_id}/revoke-organizer?comment=Cleanup%20roles", headers=h)
        assert r_revoke_with_comment.status_code == 200

        # Delete without comment -> should fail (400)
        r_delete_no_comment = client.delete(f"/api/v1/users/{user_id}", headers=h)
        assert r_delete_no_comment.status_code == 400

        # Delete with comment -> should pass (200)
        r_delete_with_comment = client.delete(f"/api/v1/users/{user_id}?comment=Removing%20test%20user", headers=h)
        assert r_delete_with_comment.status_code == 200
    finally:
        # Restore environment to avoid leaking to other tests
        if prev_testing is None:
            os.environ.pop("TESTING", None)
        else:
            os.environ["TESTING"] = prev_testing
        if prev_enforce is None:
            os.environ.pop("ENFORCE_COMMENT", None)
        else:
            os.environ["ENFORCE_COMMENT"] = prev_enforce


@patch("app.api.v1.events.AuditLogRepository.log_audit")
def test_event_delete_requires_comment_when_not_testing(mock_audit, client: TestClient, token_admin: str):
    # Ensure TESTING is disabled and enforcement is enabled for this test
    prev_testing = os.environ.get("TESTING")
    prev_enforce = os.environ.get("ENFORCE_COMMENT")
    os.environ["TESTING"] = "false"
    os.environ["ENFORCE_COMMENT"] = "true"

    h = _auth_header(token_admin)

    # Create a minimal event (organizer is the admin in tests)
    event_payload = {
        "name": "Delete Me",
        "location": "Test Hall",
        "start_time": "2025-01-01T10:00:00",
        "end_time": "2025-01-01T11:00:00",
        "notes": None,
        "timezone": "America/New_York",
        "recurring": False,
        "weekdays": None,
        "end_date": None,
        "parent_id": None,
        "attendance_threshold": None,
        "member_ids": None,
    }

    r_create = client.post("/api/v1/events/", json=event_payload, headers=h)
    assert r_create.status_code == 200
    event_id = r_create.json()["id"]

    try:
        # Delete without comment -> should fail (400)
        r_delete_no_comment = client.delete(f"/api/v1/events/{event_id}", headers=h)
        assert r_delete_no_comment.status_code == 400

        # Delete with comment -> should pass (200)
        r_delete_with_comment = client.delete(f"/api/v1/events/{event_id}?comment=Removing%20event", headers=h)
        assert r_delete_with_comment.status_code == 200
    finally:
        # Restore environment to avoid leaking to other tests
        if prev_testing is None:
            os.environ.pop("TESTING", None)
        else:
            os.environ["TESTING"] = prev_testing
        if prev_enforce is None:
            os.environ.pop("ENFORCE_COMMENT", None)
        else:
            os.environ["ENFORCE_COMMENT"] = prev_enforce
