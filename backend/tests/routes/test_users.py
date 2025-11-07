import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
from app.models.user import UserRole

@pytest.mark.usefixtures("setup_test_db")
class TestUsersRoutes:

    def test_me_route(self, client: TestClient, token_admin: str):
        """Test /me endpoint for logged-in user"""
        h = {"Authorization": f"Bearer {token_admin}"}
        r = client.get("/api/v1/users/me", headers=h)
        assert r.status_code == 200
        data = r.json()
        assert "id" in data
        assert "email" in data
        assert data["email"] == "admin@wofford.edu"

    def test_list_users_admin(self, client: TestClient, token_admin: str):
        """Admin can list all users"""
        h = {"Authorization": f"Bearer {token_admin}"}
        r = client.get("/api/v1/users/", headers=h)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert any(u["email"] == "admin@wofford.edu" for u in data)

    def test_list_users_forbidden(self, client: TestClient, token_student: str):
        """Non-admin cannot list all users"""
        h = {"Authorization": f"Bearer {token_student}"}
        r = client.get("/api/v1/users/", headers=h)
        assert r.status_code == 403

    @patch("app.api.v1.users.AuditLogRepository.log_audit")
    def test_create_user(self, mock_audit, client: TestClient, token_admin: str):
        """Admin can create a new user"""
        h = {"Authorization": f"Bearer {token_admin}"}
        payload = {
            "name": "New User",
            "email": "newuser@example.com",
            "password": "pass123",
            "roles": [UserRole.ATTENDEE]
        }
        r = client.post("/api/v1/users/", json=payload, headers=h)
        assert r.status_code == 201
        data = r.json()
        assert data["email"] == "newuser@example.com"
        assert mock_audit.called

    @patch("app.api.v1.users.AuditLogRepository.log_audit")
    def test_promote_and_revoke_organizer(self, mock_audit, client: TestClient, token_admin: str):
        """Admin can promote and revoke organizer role"""
        h = {"Authorization": f"Bearer {token_admin}"}
        # Create a test user first
        payload = {"name": "Promo User", "email": "promouser@example.com", "password": "pass123", "roles": [UserRole.ATTENDEE]}
        r = client.post("/api/v1/users/", json=payload, headers=h)
        user_id = r.json()["id"]

        # Promote to organizer
        r_promote = client.post(f"/api/v1/users/{user_id}/promote", headers=h)
        assert r_promote.status_code == 200
        assert mock_audit.called

        # Revoke organizer
        r_revoke = client.post(f"/api/v1/users/{user_id}/revoke-organizer", headers=h)
        assert r_revoke.status_code == 200
        assert mock_audit.call_count >= 2

    @patch("app.api.v1.users.AuditLogRepository.log_audit")
    def test_delete_user(self, mock_audit, client: TestClient, token_admin: str):
        """Admin can delete a user"""
        h = {"Authorization": f"Bearer {token_admin}"}
        # Create user to delete
        payload = {"name": "Delete User", "email": "deleteuser@example.com", "password": "pass123", "roles": [UserRole.ATTENDEE]}
        r = client.post("/api/v1/users/", json=payload, headers=h)
        user_id = r.json()["id"]

        r_delete = client.delete(f"/api/v1/users/{user_id}", headers=h)
        assert r_delete.status_code == 200
        assert mock_audit.call_count >= 2  # includes previous audits

    def test_delete_user_not_found(self, client: TestClient, token_admin: str):
        """Deleting a non-existing user returns 404"""
        h = {"Authorization": f"Bearer {token_admin}"}
        r_delete = client.delete("/api/v1/users/9999", headers=h)
        assert r_delete.status_code == 404

    def test_create_user_already_exists(self, client: TestClient, token_admin: str):
        """Creating a user that already exists returns 400"""
        h = {"Authorization": f"Bearer {token_admin}"}
        payload = {"name": "Admin User", "email": "admin@wofford.edu", "password": "admin", "roles": [UserRole.ADMIN]}
        r = client.post("/api/v1/users/", json=payload, headers=h)
        assert r.status_code == 400
