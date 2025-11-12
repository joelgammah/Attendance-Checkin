from fastapi.testclient import TestClient
from datetime import datetime, timedelta, timezone

def test_get_by_token_not_found(client: TestClient, token_organizer: str):
    headers = {"Authorization": f"Bearer {token_organizer}"}
    r = client.get("/api/v1/events/by-token/doesnotexist", headers=headers)
    assert r.status_code == 404
    assert "Event not found" in r.text
