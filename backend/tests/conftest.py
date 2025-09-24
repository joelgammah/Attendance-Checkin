import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.session import SessionLocal
from app.models.base import Base

# Use a separate in-memory DB for tests
engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


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
    res = client.post("/api/v1/auth/login", json={"email": "student1@wofford.edu", "password": "student1"})
    return res.json()["access_token"]
