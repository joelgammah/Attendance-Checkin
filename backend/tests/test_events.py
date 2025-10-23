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

def test_create_recurring_event_missing_fields(client, token_organizer):
    headers = {"Authorization": f"Bearer {token_organizer}"}
    # Missing weekdays
    payload = {
        "name": "Recurring Event",
        "location": "Test City",
        "start_time": datetime.now(timezone.utc).isoformat(),
        "end_time": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat(),
        "recurring": True,
        "end_date": (datetime.now(timezone.utc) + timedelta(days=7)).strftime("%Y-%m-%d"),
        "timezone": "America/New_York"
    }
    r = client.post("/api/v1/events/", json=payload, headers=headers)
    assert r.status_code == 200  # Should still create parent event, but not children

    # Missing end_date
    payload = {
        "name": "Recurring Event",
        "location": "Test City",
        "start_time": datetime.now(timezone.utc).isoformat(),
        "end_time": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat(),
        "recurring": True,
        "weekdays": ["Mon", "Wed"],
        "timezone": "America/New_York"
    }
    r = client.post("/api/v1/events/", json=payload, headers=headers)
    assert r.status_code == 200

def test_my_past(client, token_organizer):
    headers = {"Authorization": f"Bearer {token_organizer}"}
    r = client.get("/api/v1/events/mine/past", headers=headers)
    assert r.status_code == 200
    assert isinstance(r.json(), list)

def test_my_checkins(client, token_student):
    headers = {"Authorization": f"Bearer {token_student}"}
    r = client.get("/api/v1/events/my-checkins", headers=headers)
    assert r.status_code == 200
    assert isinstance(r.json(), list)

def test_checkin_outside_window(client, token_student, token_organizer):
    headers = {"Authorization": f"Bearer {token_student}"}
    # Create an event in the past
    start = datetime.now(timezone.utc) - timedelta(hours=2)
    end = start + timedelta(minutes=30)
    payload = {
        "name": "Past Event",
        "location": "Test City",
        "start_time": start.isoformat(),
        "end_time": end.isoformat(),
        "timezone": "America/New_York"
    }
    # Organizer creates event
    org_headers = {"Authorization": f"Bearer {token_organizer}"}
    r = client.post("/api/v1/events/", json=payload, headers=org_headers)
    assert r.status_code == 200, f"Event creation failed: {r.text}"
    eid = r.json()["id"]
    # Try to check in as student
    r2 = client.post("/api/v1/events/checkin", json={"event_token": r.json()["checkin_token"]}, headers=headers)
    assert r2.status_code == 400
    assert "Check-in not open" in r2.text

def test_checkin_invalid_token(client, token_student):
    headers = {"Authorization": f"Bearer {token_student}"}
    r = client.post("/api/v1/events/checkin", json={"event_token": "badtoken"}, headers=headers)
    assert r.status_code == 404
    assert "Event not found" in r.text

def test_export_csv_forbidden(client, token_student):
    # Try to export as attendee (should be forbidden)
    headers = {"Authorization": f"Bearer {token_student}"}
    r = client.get("/api/v1/events/1/attendance.csv", headers=headers)
    assert r.status_code in (403, 404)  # 404 if event doesn't exist, 403 if forbidden

def test_get_by_token_not_found(client, token_organizer):
    headers = {"Authorization": f"Bearer {token_organizer}"}
    r = client.get("/api/v1/events/by-token/doesnotexist", headers=headers)
    assert r.status_code == 404
    assert "Event not found" in r.text
