from fastapi.testclient import TestClient
from datetime import datetime, timedelta, timezone

def make_event_payload(start_offset=30, end_offset=90, tz="America/New_York"):
    now = datetime.now(timezone.utc)
    start = now + timedelta(minutes=start_offset)
    end = now + timedelta(minutes=end_offset)
    start_local = start.astimezone().strftime("%Y-%m-%dT%H:%M")
    end_local = end.astimezone().strftime("%Y-%m-%dT%H:%M")
    return {
        "name": "Test Event",
        "location": "Test City SC",
        "start_time": start_local,
        "end_time": end_local,
        "timezone": tz
    }

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

def test_create_event_invalid_times(client, token_organizer):
    payload = make_event_payload(start_offset=60, end_offset=30)
    headers = {"Authorization": f"Bearer {token_organizer}"}
    r = client.post("/api/v1/events/", json=payload, headers=headers)
    assert r.status_code == 400
    assert "Start time must be before end time" in r.text

def test_create_event_invalid_format(client, token_organizer):
    payload = make_event_payload()
    payload["start_time"] = "notadatetime"
    headers = {"Authorization": f"Bearer {token_organizer}"}
    r = client.post("/api/v1/events/", json=payload, headers=headers)
    assert r.status_code == 400
    assert "Invalid datetime format" in r.text