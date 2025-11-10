from fastapi.testclient import TestClient
from datetime import datetime, timedelta, timezone


def test_create_event_and_checkin(client: TestClient, token_organizer: str, token_student: str):
    h = {"Authorization": f"Bearer {token_organizer}"}
    now = datetime.now(timezone.utc)
    start = now + timedelta(minutes=10)
    end = start + timedelta(hours=1)
    
    # Convert to local time strings (what frontend would send)
    eastern_tz = start.astimezone(timezone(timedelta(hours=-5)))  # EST offset
    start_local = eastern_tz.strftime("%Y-%m-%dT%H:%M")
    end_local = (eastern_tz + timedelta(hours=1)).strftime("%Y-%m-%dT%H:%M")
    
    # Send timezone-aware format
    r = client.post("/api/v1/events/", json={
        "name": "Seminar",
        "location": "Hall",
        "start_time": start_local,
        "end_time": end_local,
        "timezone": "America/New_York"
    }, headers=h)
    ev = r.json()

    hs = {"Authorization": f"Bearer {token_student}"}
    rc = client.post("/api/v1/events/checkin", json={"event_token": ev["checkin_token"]}, headers=hs)
    assert rc.status_code == 200