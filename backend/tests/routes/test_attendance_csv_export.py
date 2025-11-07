from fastapi.testclient import TestClient
from datetime import datetime, timedelta, timezone


def test_attendance_csv_export(client: TestClient, token_organizer: str, token_student: str):
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

def test_export_csv_forbidden(client, token_student):
    # Try to export as attendee (should be forbidden)
    headers = {"Authorization": f"Bearer {token_student}"}
    r = client.get("/api/v1/events/1/attendance.csv", headers=headers)
    assert r.status_code in (403, 404)  # 404 if event doesn't exist, 403 if forbidden