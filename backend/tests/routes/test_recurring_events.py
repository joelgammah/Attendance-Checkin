from fastapi.testclient import TestClient
from datetime import datetime, timedelta, timezone


def test_create_recurring_event_generates_children(client: TestClient, token_organizer: str):
    headers = {"Authorization": f"Bearer {token_organizer}"}

    # Create a recurring event starting today, repeating Mon/Wed for 1 week
    start = datetime.now(timezone.utc)
    end = start + timedelta(hours=1)
    end_date = (start + timedelta(days=7)).strftime("%Y-%m-%d")  # one-week window

    payload = {
        "name": "Recurring Test Event",
        "location": "Library",
        "start_time": start.isoformat(),
        "end_time": end.isoformat(),
        "recurring": True,
        "weekdays": ["Mon", "Wed"],
        "end_date": end_date,
        "timezone": "America/New_York"
    }

    # Create parent event
    r = client.post("/api/v1/events/", json=payload, headers=headers)
    assert r.status_code == 200
    parent_event = r.json()

    # Fetch all upcoming events
    r2 = client.get("/api/v1/events/mine/upcoming", headers=headers)
    assert r2.status_code == 200
    events = r2.json()

    # Filter events with the same name
    recurring_events = [e for e in events if e["name"] == "Recurring Test Event"]

    # Parent should exist
    assert any(e["id"] == parent_event["id"] for e in recurring_events)

    # Children should have parent_id equal to parent_event id
    children = [e for e in recurring_events if e.get("parent_id") == parent_event["id"]]
    assert len(children) >= 1  # at least one child generated

    # Optional: check that all children start after the parent
    for child in children:
        assert child["start_time"] > parent_event["start_time"]


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