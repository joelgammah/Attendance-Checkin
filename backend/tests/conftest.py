import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.main import app
from app.api.deps import get_db
from app.models.base import Base
from app.models.user import User, UserRole
from app.models.user_role import UserRoleAssignment
from app.core.security import get_password_hash

# Simple test database
SQLITE_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLITE_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture
def db():
    """Provide test database session"""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

def override_get_db():
    """Simple database override for tests."""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function", autouse=True)
def setup_test_db():
    """Create fresh test database for each test."""
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Add test users
    db = TestingSessionLocal()
    demo_users = [
        ("grayj@wofford.edu", "John Gray", UserRole.ORGANIZER),
        ("clublead@wofford.edu", "Club Lead", UserRole.ORGANIZER),
        ("martincs@wofford.edu", "Collin Martin", UserRole.ATTENDEE),
        ("podrebarackc@wofford.edu", "Kate Podrebarac", UserRole.ATTENDEE),
        ("gammahja@wofford.edu", "Joel Gammah", UserRole.ATTENDEE),
        ("garrettal@wofford.edu", "Aaron Garrett", UserRole.ORGANIZER),
        ("admin@wofford.edu", "Admin User", UserRole.ADMIN),
    ]
    
    for email, name, role in demo_users:
        user = User(
            email=email, 
            name=name, 
            password_hash=get_password_hash(email.split("@")[0])
        )
        db.add(user)
    db.commit()
    
    # Add role assignments for test users
    users = db.query(User).all()
    for u in users:
        # Find the corresponding role from demo_users
        user_role = next((role for email, name, role in demo_users if email == u.email), UserRole.ATTENDEE)
        # Add role assignment
        db.add(UserRoleAssignment(user_id=u.id, role=user_role.value))
        # Aaron Garrett gets both organizer and attendee
        if u.email == "garrettal@wofford.edu":
            db.add(UserRoleAssignment(user_id=u.id, role=UserRole.ATTENDEE.value))
    
    db.commit()
    db.close()
    
    # Override the dependency
    app.dependency_overrides[get_db] = override_get_db
    
    yield
    
    # Clean up
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def token_organizer(client):
    res = client.post("/api/v1/auth/login", json={"email": "grayj@wofford.edu", "password": "grayj"})
    return res.json()["access_token"]


@pytest.fixture
def token_student(client):
    res = client.post("/api/v1/auth/login", json={"email": "martincs@wofford.edu", "password": "martincs"})
    j = res.json()
    assert res.status_code == 200, f"login failed for test student: {j}"
    return j["access_token"]

@pytest.fixture
def token_admin(client):
    res = client.post("/api/v1/auth/login", json={"email": "admin@wofford.edu", "password": "admin"})
    return res.json()["access_token"]


