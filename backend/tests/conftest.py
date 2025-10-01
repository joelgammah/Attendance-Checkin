import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.session import SessionLocal
from app.models.base import Base
from sqlalchemy import delete
from app.models.event import Event
from app.models.attendance import Attendance

# Use a separate in-memory DB for tests
engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

@pytest.fixture(autouse=True)
def clear_event_data_between_tests():
    """
    Ensure event-related tables are cleared between tests so each test runs with a clean slate.
    Keeps seeded users intact (don't drop all tables).
    """
    with SessionLocal() as s:
        s.execute(delete(Attendance))
        s.execute(delete(Event))
        s.commit()
    yield


@pytest.fixture(autouse=True)
def _setup_db(monkeypatch):
    Base.metadata.create_all(bind=engine)
    # Patch SessionLocal used by the app
    monkeypatch.setattr("app.db.session.SessionLocal", TestingSessionLocal)
    # trigger startup seed
    with TestClient(app):
        yield


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def token_organizer(client):
    res = client.post("/api/v1/auth/login", json={"email": "grayj@wofford.edu", "password": "grayj"})
    return res.json()["access_token"]


@pytest.fixture
def token_student(client):
    # Use one of the demo users seeded in app.on_startup (see app.main.on_startup)
    # seeded students include: martincs@wofford.edu, podrebarackc@wofford.edu, gammahja@wofford.edu
    res = client.post("/api/v1/auth/login", json={"email": "martincs@wofford.edu", "password": "martincs"})
    # If login failed the JSON will contain a 'detail' message; surface it for easier debugging
    j = res.json()
    assert res.status_code == 200, f"login failed for test student: {j}"
    return j["access_token"]
