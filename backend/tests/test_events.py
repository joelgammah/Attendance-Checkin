from fastapi.testclient import TestClient
from datetime import datetime, timedelta, timezone


def test_create_event_and_list(client: TestClient, token_organizer: str):
    headers = {"Authorization": f"Bearer {token_organizer}"}
    start = datetime.now(timezone.utc) + timedelta(minutes=30)
    end = start + timedelta(hours=1)
    payload = {"name": "CS Class", "location": "Olin 101", "start_time": start.isoformat(), "end_time": end.isoformat()}
    r = client.post("/api/v1/events/", json=payload, headers=headers)
    assert r.status_code == 200
    eid = r.json()["id"]

    r2 = client.get("/api/v1/events/mine/upcoming", headers=headers)
    assert r2.status_code == 200
    assert any(e["id"] == eid for e in r2.json())
