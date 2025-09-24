from fastapi.testclient import TestClient
from datetime import datetime, timedelta, timezone


def test_checkin_flow(client: TestClient, token_organizer: str, token_student: str):
    h = {"Authorization": f"Bearer {token_organizer}"}
    now = datetime.now(timezone.utc)
    start = now + timedelta(minutes=10)
    end = start + timedelta(hours=1)
    # open window default 15 min -> students can check-in 15 before start
    r = client.post("/api/v1/events/", json={"name":"Seminar","location":"Hall","start_time": start.isoformat(),"end_time": end.isoformat()}, headers=h)
    ev = r.json()

    hs = {"Authorization": f"Bearer {token_student}"}
    rc = client.post("/api/v1/events/checkin", json={"event_token": ev["checkin_token"]}, headers=hs)
    assert rc.status_code == 200

    csv = client.get(f"/api/v1/events/{ev['id']}/attendance.csv", headers=h)
    assert csv.status_code == 200
    assert "attendee_id" in csv.text
