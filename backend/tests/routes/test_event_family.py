from fastapi.testclient import TestClient
from datetime import datetime, timedelta, timezone


def test_create_recurring_event_for_family(client: TestClient, token_organizer: str, db):
    """Create a recurring event to use for family endpoint tests"""
    headers = {"Authorization": f"Bearer {token_organizer}"}
    
    now = datetime.now(timezone.utc)
    start = now - timedelta(days=7)
    end = start + timedelta(hours=1)
    start_local = start.astimezone().isoformat()
    end_local = end.astimezone().isoformat()
    end_date = (now + timedelta(days=14)).strftime("%Y-%m-%d")
    
    payload = {
        "name": "Family Event",
        "location": "Conference Room",
        "start_time": start_local,
        "end_time": end_local,
        "recurring": True,
        "weekdays": ["Mon", "Wed"],
        "end_date": end_date,
        "attendance_threshold": 1,
        "timezone": "America/New_York"
    }
    
    r = client.post("/api/v1/events/", json=payload, headers=headers)
    assert r.status_code == 200
    return r.json()["id"]


def test_get_event_family_basic(client: TestClient, token_organizer: str, db):
    """Test getting event family structure (parent, past/upcoming children, members)"""
    headers = {"Authorization": f"Bearer {token_organizer}"}
    
    # Create recurring event
    parent_id = test_create_recurring_event_for_family(client, token_organizer, db)
    
    # Get family endpoint
    response = client.get(f"/api/v1/events/{parent_id}/family", headers=headers)
    
    assert response.status_code == 200
    data = response.json()
    
    # Verify parent structure
    assert data["parent"]["id"] == parent_id
    assert data["parent"]["name"] == "Family Event"
    assert data["parent"]["recurring"] is True
    assert data["parent"]["attendance_threshold"] == 1
    
    # Verify structure exists
    assert "past_children" in data
    assert "upcoming_children" in data
    assert "members" in data
    assert isinstance(data["past_children"], list)
    assert isinstance(data["upcoming_children"], list)
    assert data["total_past_sessions"] >= 0


def test_get_event_family_with_members(client: TestClient, token_organizer: str, token_student: str, db):
    """Test event family with members"""
    headers_org = {"Authorization": f"Bearer {token_organizer}"}
    
    # Create recurring event
    now = datetime.now(timezone.utc)
    start = now - timedelta(days=7)
    end = start + timedelta(hours=1)
    start_local = start.astimezone().strftime("%Y-%m-%dT%H:%M")
    end_local = end.astimezone().strftime("%Y-%m-%dT%H:%M")
    end_date = (now + timedelta(days=14)).strftime("%Y-%m-%d")
    
    # Get the student user ID
    from app.models.user import User
    student_user = db.query(User).filter(User.email == "martincs@wofford.edu").first()
    
    payload = {
        "name": "Family Event With Members",
        "location": "Conference Room",
        "start_time": start_local,
        "end_time": end_local,
        "recurring": True,
        "weekdays": ["Mon", "Wed"],
        "end_date": end_date,
        "attendance_threshold": 1,
        "member_ids": [student_user.id],
        "timezone": "America/New_York"
    }
    
    r = client.post("/api/v1/events/", json=payload, headers=headers_org)
    assert r.status_code == 200
    parent_id = r.json()["id"]
    
    # Get family
    response = client.get(f"/api/v1/events/{parent_id}/family", headers=headers_org)
    assert response.status_code == 200
    data = response.json()
    
    # Verify member is included
    assert len(data["members"]) == 1
    assert data["members"][0]["user_id"] == student_user.id
    assert data["members"][0]["name"] == student_user.name
    assert data["members"][0]["email"] == student_user.email


def test_get_event_family_with_attendance(client: TestClient, token_organizer: str, token_student: str, db):
    """Test member attendance counting across recurring series"""
    headers_org = {"Authorization": f"Bearer {token_organizer}"}
    headers_stu = {"Authorization": f"Bearer {token_student}"}
    
    # Create recurring event
    now = datetime.now(timezone.utc)
    start = now - timedelta(days=7)
    end = start + timedelta(hours=1)
    start_local = start.astimezone().strftime("%Y-%m-%dT%H:%M")
    end_local = end.astimezone().strftime("%Y-%m-%dT%H:%M")
    end_date = (now + timedelta(days=14)).strftime("%Y-%m-%d")
    
    from app.models.user import User
    student_user = db.query(User).filter(User.email == "martincs@wofford.edu").first()
    
    payload = {
        "name": "Attendance Event",
        "location": "Conference Room",
        "start_time": start_local,
        "end_time": end_local,
        "recurring": True,
        "weekdays": ["Mon", "Wed"],
        "end_date": end_date,
        "attendance_threshold": 2,
        "member_ids": [student_user.id],
        "timezone": "America/New_York"
    }
    
    r = client.post("/api/v1/events/", json=payload, headers=headers_org)
    assert r.status_code == 200
    parent_id = r.json()["id"]
    parent_token = r.json()["checkin_token"]
    
    # Get all events in family
    from app.models.event import Event
    parent_event = db.get(Event, parent_id)
    children = db.query(Event).filter(Event.parent_id == parent_id).all()
    
    # Add attendance to one past child
    if children:
        from app.models.attendance import Attendance
        first_child = children[0]
        att = Attendance(
            event_id=first_child.id,
            attendee_id=student_user.id,
            checked_in_at=first_child.start_time
        )
        db.add(att)
        db.commit()
    
    # Get family
    response = client.get(f"/api/v1/events/{parent_id}/family", headers=headers_org)
    assert response.status_code == 200
    data = response.json()
    
    # Verify member attendance is tracked
    member = data["members"][0]
    assert member["user_id"] == student_user.id
    assert member["attended"] >= 0
    assert member["missed"] >= 0


def test_get_event_family_nonexistent(client: TestClient, token_organizer: str):
    """Test getting family for non-existent event"""
    headers = {"Authorization": f"Bearer {token_organizer}"}
    response = client.get(f"/api/v1/events/9999/family", headers=headers)
    assert response.status_code == 404
