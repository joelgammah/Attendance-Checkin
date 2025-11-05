from fastapi.testclient import TestClient
from datetime import datetime, timedelta, timezone


def test_my_past(client: TestClient, token_organizer: str):
    headers = {"Authorization": f"Bearer {token_organizer}"}
    r = client.get("/api/v1/events/mine/past", headers=headers)
    assert r.status_code == 200
    assert isinstance(r.json(), list)