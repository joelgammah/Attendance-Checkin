from fastapi.testclient import TestClient
from datetime import datetime, timedelta, timezone


def test_checkin_flow(client: TestClient, token_organizer: str, token_student: str):
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

    csv = client.get(f"/api/v1/events/{ev['id']}/attendance.csv", headers=h)
    assert csv.status_code == 200
    # Validate enhanced CSV format with proper headers and summary
    csv_content = csv.text
    assert "Event Name,Event Location,Attendee ID,Attendee Name,Attendee Email,Date/Time Checked In" in csv_content
    assert "Organizer Name:" in csv_content
    assert "Total Attendance:" in csv_content


def test_my_checkins(client: TestClient, token_organizer: str, token_student: str):
    # Create an event
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
        "name": "Test Event",
        "location": "Test Hall",
        "start_time": start_local,
        "end_time": end_local,
        "timezone": "America/New_York"
    }, headers=h)
    ev = r.json()

    # Check in as student
    hs = {"Authorization": f"Bearer {token_student}"}
    rc = client.post("/api/v1/events/checkin", json={"event_token": ev["checkin_token"]}, headers=hs)
    assert rc.status_code == 200

    # Get student's check-ins
    checkins = client.get("/api/v1/events/my-checkins", headers=hs)
    assert checkins.status_code == 200
    data = checkins.json()
    assert len(data) == 1
    assert data[0]["event_name"] == "Test Event"
    assert data[0]["event_location"] == "Test Hall"
