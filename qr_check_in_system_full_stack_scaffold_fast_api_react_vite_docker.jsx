# Project Tree

```
backend/
  app/
    core/__init__.py
    core/config.py
    core/security.py
    db/__init__.py
    db/session.py
    models/__init__.py
    models/base.py
    models/user.py
    models/organization.py
    models/event.py
    models/attendance.py
    repositories/__init__.py
    repositories/base.py
    repositories/user_repo.py
    repositories/event_repo.py
    repositories/attendance_repo.py
    services/__init__.py
    services/auth_service.py
    services/event_service.py
    api/__init__.py
    api/deps.py
    api/router.py
    api/v1/__init__.py
    api/v1/auth.py
    api/v1/users.py
    api/v1/events.py
    main.py
  alembic/
    versions/
    env.py
  alembic.ini
  pyproject.toml
  pytest.ini
  .gitignore
  tests/
    conftest.py
    test_auth.py
    test_events.py
    test_attendance.py
frontend/
  index.html
  vite.config.ts
  tsconfig.json
  package.json
  postcss.config.cjs
  .gitignore
  src/
    main.tsx
    App.tsx
    styles/index.css
    api/client.ts
    api/auth.ts
    api/events.ts
    types.ts
    components/Nav.tsx
    components/Protected.tsx
    pages/LoginPage.tsx
    pages/DashboardPage.tsx
    pages/EventFormPage.tsx
    pages/EventDetailPage.tsx
    pages/CheckInPage.tsx
    test/
      LoginPage.test.tsx
      EventFlow.test.tsx
  test_setup.ts
infra/
  docker/
    backend.Dockerfile
    frontend.Dockerfile
    nginx.conf
docker-compose.yml
README.md
```

---

## backend/app/core/config.py
```python
from pydantic import BaseModel
import os

class Settings(BaseModel):
    PROJECT_NAME: str = "QR Check-In API"
    API_V1_PREFIX: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key-change")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 12
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./app.db")
    CORS_ORIGINS: list[str] = [os.getenv("CORS_ORIGIN", "http://localhost:5173")] 
    DEFAULT_CHECKIN_OPEN_MINUTES: int = 15

settings = Settings()
```

## backend/app/core/security.py
```python
from datetime import datetime, timedelta, timezone
from typing import Any, Optional
import jwt
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"


def create_access_token(subject: str, secret_key: str, expires_minutes: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    to_encode: dict[str, Any] = {"sub": subject, "exp": expire}
    return jwt.encode(to_encode, secret_key, algorithm=ALGORITHM)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)
```

## backend/app/db/session.py
```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
```

## backend/app/models/base.py
```python
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import Integer

class Base(DeclarativeBase):
    pass

class IDMixin:
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
```

## backend/app/models/user.py
```python
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Enum
from app.models.base import Base, IDMixin
import enum

class UserRole(str, enum.Enum):
    ATTENDEE = "attendee"
    ORGANIZER = "organizer"
    ADMIN = "admin"

class User(IDMixin, Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.ATTENDEE)
    password_hash: Mapped[str] = mapped_column(String(255))

    events = relationship("Event", back_populates="organizer")
```

## backend/app/models/organization.py
```python
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String
from app.models.base import Base, IDMixin

class Organization(IDMixin, Base):
    __tablename__ = "organizations"

    name: Mapped[str] = mapped_column(String(255), unique=True)
    users = relationship("UserOrganization", back_populates="organization")
```

## backend/app/models/event.py
```python
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, ForeignKey, DateTime, Integer
from app.models.base import Base, IDMixin

class Event(IDMixin, Base):
    __tablename__ = "events"

    name: Mapped[str] = mapped_column(String(255))
    location: Mapped[str] = mapped_column(String(255))
    start_time: Mapped["datetime"] = mapped_column(DateTime(timezone=True))
    end_time: Mapped["datetime"] = mapped_column(DateTime(timezone=True))
    notes: Mapped[str | None] = mapped_column(String(2000), default=None)
    checkin_open_minutes: Mapped[int] = mapped_column(Integer, default=15)
    checkin_token: Mapped[str] = mapped_column(String(64), unique=True, index=True)

    organizer_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    organizer = relationship("User", back_populates="events")

    attendances = relationship("Attendance", back_populates="event", cascade="all, delete-orphan")
```

## backend/app/models/attendance.py
```python
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, ForeignKey, DateTime, UniqueConstraint
from app.models.base import Base, IDMixin

class Attendance(IDMixin, Base):
    __tablename__ = "attendances"
    __table_args__ = (UniqueConstraint("event_id", "attendee_id", name="uq_event_attendee"),)

    event_id: Mapped[int] = mapped_column(ForeignKey("events.id"))
    attendee_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    checked_in_at: Mapped["datetime"] = mapped_column(DateTime(timezone=True))
    source_ip: Mapped[str | None] = mapped_column(String(64))
    user_agent: Mapped[str | None] = mapped_column(String(255))

    event = relationship("Event", back_populates="attendances")
```

## backend/app/repositories/base.py
```python
from typing import Generic, TypeVar, Type
from sqlalchemy.orm import Session
from app.models.base import Base

ModelType = TypeVar("ModelType", bound=Base)

class BaseRepository(Generic[ModelType]):
    def __init__(self, model: Type[ModelType]):
        self.model = model

    def get(self, db: Session, id: int) -> ModelType | None:
        return db.get(self.model, id)

    def list(self, db: Session, skip: int = 0, limit: int = 100):
        return db.query(self.model).offset(skip).limit(limit).all()

    def create(self, db: Session, **kwargs) -> ModelType:
        obj = self.model(**kwargs)
        db.add(obj)
        db.flush()
        db.refresh(obj)
        return obj

    def delete(self, db: Session, id: int) -> None:
        obj = self.get(db, id)
        if obj:
            db.delete(obj)
```

## backend/app/repositories/user_repo.py
```python
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.repositories.base import BaseRepository
from app.models.user import User

class UserRepository(BaseRepository[User]):
    def __init__(self):
        super().__init__(User)

    def get_by_email(self, db: Session, email: str) -> User | None:
        return db.execute(select(User).where(User.email == email)).scalar_one_or_none()
```

## backend/app/repositories/event_repo.py
```python
from sqlalchemy.orm import Session
from sqlalchemy import select
from datetime import datetime, timezone
from app.repositories.base import BaseRepository
from app.models.event import Event

class EventRepository(BaseRepository[Event]):
    def __init__(self):
        super().__init__(Event)

    def get_by_token(self, db: Session, token: str) -> Event | None:
        return db.execute(select(Event).where(Event.checkin_token == token)).scalar_one_or_none()

    def upcoming_for_organizer(self, db: Session, organizer_id: int):
        now = datetime.now(timezone.utc)
        stmt = select(Event).where(Event.organizer_id == organizer_id, Event.end_time >= now).order_by(Event.start_time)
        return db.execute(stmt).scalars().all()

    def past_for_organizer(self, db: Session, organizer_id: int):
        now = datetime.now(timezone.utc)
        stmt = select(Event).where(Event.organizer_id == organizer_id, Event.end_time < now).order_by(Event.start_time.desc())
        return db.execute(stmt).scalars().all()
```

## backend/app/repositories/attendance_repo.py
```python
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from app.repositories.base import BaseRepository
from app.models.attendance import Attendance

class AttendanceRepository(BaseRepository[Attendance]):
    def __init__(self):
        super().__init__(Attendance)

    def count_for_event(self, db: Session, event_id: int) -> int:
        return db.execute(select(func.count()).select_from(Attendance).where(Attendance.event_id == event_id)).scalar_one()

    def list_for_event(self, db: Session, event_id: int):
        return db.execute(select(Attendance).where(Attendance.event_id == event_id)).scalars().all()
```

## backend/app/api/deps.py
```python
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.session import SessionLocal
from app.repositories.user_repo import UserRepository
import jwt

reuse_oauth = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_PREFIX}/auth/login")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(db: Session = Depends(get_db), token: str = Depends(reuse_oauth)):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        email: str = payload.get("sub")
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = UserRepository().get_by_email(db, email)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user
```

## backend/app/api/router.py
```python
from fastapi import APIRouter
from app.core.config import settings
from app.api.v1 import auth, events, users

api_router = APIRouter(prefix=settings.API_V1_PREFIX)
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(events.router, prefix="/events", tags=["events"])
```

## backend/app/api/v1/auth.py
```python
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import create_access_token, verify_password
from app.repositories.user_repo import UserRepository
from app.api.deps import get_db

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = UserRepository().get_by_email(db, data.email)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    # For testing: password must match the username part before '@'
    username = data.email.split("@")[0]
    if data.password != username:
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    token = create_access_token(user.email, settings.SECRET_KEY, settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return TokenResponse(access_token=token)
```

## backend/app/api/v1/users.py
```python
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.api.deps import get_current_user

router = APIRouter()

class MeResponse(BaseModel):
    id: int
    email: str
    name: str
    role: str

@router.get("/me", response_model=MeResponse)
def me(user = Depends(get_current_user)):
    return MeResponse(id=user.id, email=user.email, name=user.name, role=user.role.value)
```

## backend/app/api/v1/events.py
```python
from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, Field
from typing import List
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
import secrets

from app.api.deps import get_db, get_current_user
from app.models.user import UserRole
from app.repositories.event_repo import EventRepository
from app.repositories.attendance_repo import AttendanceRepository
from app.models.event import Event
from app.models.attendance import Attendance
from app.core.config import settings

router = APIRouter()

event_repo = EventRepository()
att_repo = AttendanceRepository()

class EventCreate(BaseModel):
    name: str
    location: str
    start_time: datetime
    end_time: datetime
    notes: str | None = None
    checkin_open_minutes: int | None = None

class EventOut(BaseModel):
    id: int
    name: str
    location: str
    start_time: datetime
    end_time: datetime
    notes: str | None
    checkin_open_minutes: int
    checkin_token: str
    attendance_count: int = 0

    class Config:
        from_attributes = True

@router.post("/", response_model=EventOut)
def create_event(payload: EventCreate, db: Session = Depends(get_db), user = Depends(get_current_user)):
    if user.role not in (UserRole.ORGANIZER, UserRole.ADMIN):
        raise HTTPException(403, "Only organizers can create events")
    token = secrets.token_urlsafe(16)
    event = event_repo.create(
        db,
        name=payload.name,
        location=payload.location,
        start_time=payload.start_time,
        end_time=payload.end_time,
        notes=payload.notes,
        checkin_open_minutes=payload.checkin_open_minutes or settings.DEFAULT_CHECKIN_OPEN_MINUTES,
        checkin_token=token,
        organizer_id=user.id,
    )
    return EventOut.model_validate({**event.__dict__, "attendance_count": 0})

@router.get("/mine/upcoming", response_model=List[EventOut])
def my_upcoming(db: Session = Depends(get_db), user = Depends(get_current_user)):
    items = event_repo.upcoming_for_organizer(db, user.id)
    return [EventOut.model_validate({**e.__dict__, "attendance_count": att_repo.count_for_event(db, e.id)}) for e in items]

@router.get("/mine/past", response_model=List[EventOut])
def my_past(db: Session = Depends(get_db), user = Depends(get_current_user)):
    items = event_repo.past_for_organizer(db, user.id)
    return [EventOut.model_validate({**e.__dict__, "attendance_count": att_repo.count_for_event(db, e.id)}) for e in items]

class CheckInRequest(BaseModel):
    event_token: str = Field(..., description="Event QR token")

class AttendanceOut(BaseModel):
    id: int
    event_id: int
    attendee_id: int
    checked_in_at: datetime

    class Config:
        from_attributes = True

@router.post("/checkin", response_model=AttendanceOut)
def check_in(req: CheckInRequest, db: Session = Depends(get_db), user = Depends(get_current_user)):
    event = event_repo.get_by_token(db, req.event_token)
    if not event:
        raise HTTPException(404, "Event not found")

    now = datetime.now(timezone.utc)
    open_at = event.start_time - timedelta(minutes=event.checkin_open_minutes)
    if not (open_at <= now <= event.end_time):
        raise HTTPException(400, "Check-in not open for this event")

    # Upsert-like: unique constraint prevents duplicates; try to create
    att = att_repo.create(
        db,
        event_id=event.id,
        attendee_id=user.id,
        checked_in_at=now,
        source_ip=None,
        user_agent=None,
    )
    db.commit()
    db.refresh(att)
    return att

@router.get("/{event_id}/attendance.csv")
def export_csv(event_id: int, db: Session = Depends(get_db), user = Depends(get_current_user)):
    event = event_repo.get(db, event_id)
    if not event:
        raise HTTPException(404, "Event not found")
    if user.role not in (UserRole.ORGANIZER, UserRole.ADMIN) or event.organizer_id != user.id:
        raise HTTPException(403, "Forbidden")

    rows = att_repo.list_for_event(db, event_id)
    header = "attendance_id,event_id,attendee_id,checked_in_at\n"
    body = "".join(f"{r.id},{r.event_id},{r.attendee_id},{r.checked_in_at.isoformat()}\n" for r in rows)
    return Response(content=header + body, media_type="text/csv")

@router.get("/by-token/{token}", response_model=EventOut)
def get_by_token(token: str, db: Session = Depends(get_db), user = Depends(get_current_user)):
    e = event_repo.get_by_token(db, token)
    if not e:
        raise HTTPException(404, "Event not found")
    count = att_repo.count_for_event(db, e.id)
    return EventOut.model_validate({**e.__dict__, "attendance_count": count})
```

## backend/app/api/__init__.py
```python
# empty package marker
```

## backend/app/services/auth_service.py
```python
# Placeholder for future expansion (directory kept for structure/tests)
```

## backend/app/services/event_service.py
```python
# Placeholder for service-level orchestration if needed later
```

## backend/app/api/__init__.py & backend/app/__init__.py
```python
# empty
```

## backend/app/main.py
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.router import api_router
from app.db.session import engine
from app.models.base import Base
from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from app.core.security import get_password_hash

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

# Create tables & seed a few test users on startup (idempotent for SQLite)
@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    with Session(bind=engine) as db:
        if not db.query(User).count():
            demo = [
                ("grayj@wofford.edu", "Jason Gray", UserRole.ORGANIZER),
                ("clublead@wofford.edu", "Club Lead", UserRole.ORGANIZER),
                ("student1@wofford.edu", "Student One", UserRole.ATTENDEE),
                ("student2@wofford.edu", "Student Two", UserRole.ATTENDEE),
            ]
            for email, name, role in demo:
                u = User(email=email, name=name, role=role, password_hash=get_password_hash(email.split("@")[0]))
                db.add(u)
            db.commit()
```

## backend/alembic.ini
```ini
[alembic]
script_location = alembic
sqlalchemy.url = sqlite:///./app.db

[loggers]
keys = root,sqlalchemy,alembic

[handlers]
keys = console

[formatters]
keys = generic

[logger_root]
level = WARN
handlers = console

[logger_sqlalchemy]
level = WARN
handlers =
qualname = sqlalchemy.engine

[logger_alembic]
level = INFO
handlers =
qualname = alembic

[handler_console]
class = StreamHandler
args = (sys.stderr,)
level = NOTSET
formatter = generic

[formatter_generic]
format = %(levelname)-5.5s [%(name)s] %(message)s
```

## backend/alembic/env.py
```python
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
import os

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

def get_url():
    return os.getenv("DATABASE_URL", config.get_main_option("sqlalchemy.url"))

from app.models.base import Base  # noqa: E402
from app.models.user import User  # noqa: F401
from app.models.organization import Organization  # noqa: F401
from app.models.event import Event  # noqa: F401
from app.models.attendance import Attendance  # noqa: F401

target_metadata = Base.metadata

def run_migrations_offline():
    url = get_url()
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    connectable = engine_from_config(
        {"sqlalchemy.url": get_url()},
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

## backend/pyproject.toml
```toml
[project]
name = "qr-checkin-backend"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
  "fastapi>=0.112",
  "uvicorn[standard]>=0.30",
  "sqlalchemy>=2.0",
  "pydantic>=2.7",
  "alembic>=1.13",
  "python-multipart>=0.0.9",
  "passlib[bcrypt]>=1.7",
  "pyjwt>=2.8",
]

[project.optional-dependencies]
dev = ["pytest>=8", "pytest-cov>=5", "httpx>=0.27"]

[tool.pytest.ini_options]
addopts = "-q --cov=app --cov-report=term-missing:skip-covered --cov-report=html --cov-fail-under=80"
```

## backend/pytest.ini
```ini
[pytest]
filterwarnings =
    ignore::DeprecationWarning
```

## backend/.gitignore
```
__pycache__/
*.pyc
app.db
htmlcov/
.coverage
.env
```

## backend/tests/conftest.py
```python
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
```

## backend/tests/test_auth.py
```python
from fastapi.testclient import TestClient
from app.main import app

def test_login_success(client: TestClient):
    r = client.post("/api/v1/auth/login", json={"email": "grayj@wofford.edu", "password": "grayj"})
    assert r.status_code == 200
    assert "access_token" in r.json()

def test_login_failure_wrong_pwd(client: TestClient):
    r = client.post("/api/v1/auth/login", json={"email": "grayj@wofford.edu", "password": "nope"})
    assert r.status_code == 400
```

## backend/tests/test_events.py
```python
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
```

## backend/tests/test_attendance.py
```python
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
```

---

## frontend/package.json
```json
{
  "name": "qr-checkin-frontend",
  "version": "0.1.0",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview --port 5173",
    "test": "vitest",
    "test:cov": "vitest run --coverage"
  },
  "dependencies": {
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "qrcode": "^1.5.3"
  },
  "devDependencies": {
    "@types/react": "18.3.5",
    "@types/react-dom": "18.3.0",
    "@vitest/coverage-v8": "1.6.0",
    "msw": "2.3.1",
    "typescript": "5.6.2",
    "vite": "5.4.6",
    "vitest": "1.6.0",
    "@testing-library/react": "16.0.1",
    "@testing-library/jest-dom": "6.4.8",
    "jsdom": "26.1.0",
    "@tailwindcss/postcss": "4.0.0"
  }
}
```

## frontend/vite.config.ts
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': 'http://localhost:8000' } },
  test: {
    environment: 'jsdom',
    setupFiles: './test_setup.ts',
    globals: true,
    css: true,
    coverage: { provider: 'v8', reporter: ['text','html','lcov'], reportsDirectory: 'coverage' }
  }
})
```

## frontend/tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "jsx": "react-jsx",
    "moduleResolution": "Bundler",
    "noEmit": true,
    "strict": true,
    "skipLibCheck": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src", "test_setup.ts"]
}
```

## frontend/postcss.config.cjs
```js
module.exports = { plugins: { "@tailwindcss/postcss": {} } }
```

## frontend/.gitignore
```
node_modules
.dist
coverage
.DS_Store
```

## frontend/index.html
```html
<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>QR Check-In</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

## frontend/src/styles/index.css
```css
@import "tailwindcss";
```

## frontend/src/types.ts
```ts
export type Role = 'attendee' | 'organizer' | 'admin'
export interface User { id: number; email: string; name: string; role: Role }
export interface EventOut { id: number; name: string; location: string; start_time: string; end_time: string; notes?: string|null; checkin_open_minutes: number; checkin_token: string; attendance_count: number }
```

## frontend/src/api/client.ts
```ts
const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export async function fetchJson<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token')
  const headers: HeadersInit = { 'Content-Type': 'application/json', ...(opts.headers || {}) }
  if (token) (headers as any)['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${BASE}${path}`, { ...opts, headers })
  if (!res.ok) {
    const msg = await res.text()
    throw new Error(msg || res.statusText)
  }
  return res.headers.get('content-type')?.includes('application/json') ? res.json() : (await res.text() as any)
}
```

## frontend/src/api/auth.ts
```ts
import { fetchJson } from './client'

export async function login(email: string, password: string) {
  const data = await fetchJson<{access_token: string}>(`/api/v1/auth/login`, { method: 'POST', body: JSON.stringify({ email, password }) })
  localStorage.setItem('token', data.access_token)
}

export function logout(){ localStorage.removeItem('token') }
```

## frontend/src/api/events.ts
```ts
import { fetchJson } from './client'
import type { EventOut } from '../types'

export async function createEvent(payload: any): Promise<EventOut> {
  return fetchJson<EventOut>(`/api/v1/events/`, { method: 'POST', body: JSON.stringify(payload) })
}
export async function myUpcoming(): Promise<EventOut[]> { return fetchJson(`/api/v1/events/mine/upcoming`) }
export async function myPast(): Promise<EventOut[]> { return fetchJson(`/api/v1/events/mine/past`) }
export async function getByToken(token: string): Promise<EventOut> { return fetchJson(`/api/v1/events/by-token/${token}`) }
export async function checkIn(token: string) { return fetchJson(`/api/v1/events/checkin`, { method: 'POST', body: JSON.stringify({ event_token: token }) }) }
export function csvUrl(eventId: number) { return `${import.meta.env.VITE_API_URL ?? 'http://localhost:8000'}/api/v1/events/${eventId}/attendance.csv` }
```

## frontend/src/main.tsx
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/index.css'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
```

## frontend/src/components/Nav.tsx
```tsx
import { logout } from '../api/auth'
import { Link } from './Protected'

export default function Nav(){
  return (
    <nav className="w-full flex items-center justify-between p-4 border-b">
      <div className="font-bold">QR Check-In</div>
      <div className="flex gap-4">
        <Link to="/">Dashboard</Link>
        <Link to="/events/new">Create Event</Link>
        <button onClick={()=>{logout(); location.href='/login'}} className="px-3 py-1 rounded bg-gray-100">Logout</button>
      </div>
    </nav>
  )
}
```

## frontend/src/components/Protected.tsx
```tsx
import React from 'react'

export function useAuth(){
  const [authed, setAuthed] = React.useState<boolean>(!!localStorage.getItem('token'))
  React.useEffect(()=>{
    const onStorage = ()=> setAuthed(!!localStorage.getItem('token'))
    window.addEventListener('storage', onStorage)
    return ()=> window.removeEventListener('storage', onStorage)
  },[])
  return authed
}

export function Link(props: React.AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }){
  return <a {...props} href={props.to} className={"text-blue-600 hover:underline "+(props.className??'')} />
}

export default function Protected({ children }: { children: React.ReactNode }){
  const authed = useAuth()
  if(!authed){ location.href = '/login'; return null }
  return <>{children}</>
}
```

## frontend/src/pages/LoginPage.tsx
```tsx
import React from 'react'
import { login } from '../api/auth'

export default function LoginPage(){
  const [email, setEmail] = React.useState('grayj@wofford.edu')
  const [password, setPassword] = React.useState('grayj')
  const [error, setError] = React.useState('')

  async function onSubmit(e: React.FormEvent){
    e.preventDefault()
    try{ await login(email, password); location.href='/' }catch(err:any){ setError(err.message) }
  }

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <form onSubmit={onSubmit} className="w-full max-w-md p-6 rounded-2xl shadow grid gap-3">
        <h1 className="text-2xl font-bold">Login</h1>
        {error && <div className="text-red-600 text-sm" role="alert">{error}</div>}
        <label className="grid gap-1">Email<input value={email} onChange={e=>setEmail(e.target.value)} className="border rounded p-2" /></label>
        <label className="grid gap-1">Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="border rounded p-2" /></label>
        <button className="mt-2 bg-black text-white rounded p-2">Sign in</button>
        <p className="text-sm text-gray-600">Tip: password is the username part (before @)</p>
      </form>
    </div>
  )
}
```

## frontend/src/pages/DashboardPage.tsx
```tsx
import React from 'react'
import Nav from '../components/Nav'
import { myUpcoming, myPast, csvUrl } from '../api/events'
import type { EventOut } from '../types'

export default function DashboardPage(){
  const [upcoming, setUpcoming] = React.useState<EventOut[]>([])
  const [past, setPast] = React.useState<EventOut[]>([])
  React.useEffect(()=>{ (async()=>{ setUpcoming(await myUpcoming()); setPast(await myPast()) })() },[])

  return (
    <div>
      <Nav />
      <div className="p-4 grid gap-6">
        <section>
          <h2 className="text-xl font-semibold mb-2">Upcoming Events</h2>
          <EventList items={upcoming} />
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-2">Past Events</h2>
          <EventList items={past} showCsv />
        </section>
      </div>
    </div>
  )
}

function EventList({ items, showCsv=false }: { items: EventOut[]; showCsv?: boolean }){
  if(items.length===0) return <div className="text-gray-600">No events yet.</div>
  return (
    <ul className="grid gap-3">
      {items.map(e=> (
        <li key={e.id} className="border rounded-xl p-3 flex items-center justify-between">
          <div>
            <div className="font-medium">{e.name}</div>
            <div className="text-sm text-gray-600">{new Date(e.start_time).toLocaleString()} – {new Date(e.end_time).toLocaleString()} @ {e.location}</div>
            <div className="text-sm">Attendance: {e.attendance_count}</div>
          </div>
          <div className="flex gap-2">
            <a className="px-3 py-1 rounded bg-gray-100" href={`/events/${e.checkin_token}`}>Show QR</a>
            {showCsv && <a className="px-3 py-1 rounded bg-gray-100" href={csvUrl(e.id)}>Export CSV</a>}
          </div>
        </li>
      ))}
    </ul>
  )
}
```

## frontend/src/pages/EventFormPage.tsx
```tsx
import React from 'react'
import Nav from '../components/Nav'
import { createEvent } from '../api/events'

export default function EventFormPage(){
  const [form, setForm] = React.useState({ name: '', location: '', start_time: '', end_time: '', notes: '' })
  const [error, setError] = React.useState('')

  function update<K extends keyof typeof form>(k: K, v: string){ setForm(s=>({ ...s, [k]: v })) }

  async function onSubmit(e: React.FormEvent){
    e.preventDefault()
    try {
      const payload = { ...form, start_time: new Date(form.start_time).toISOString(), end_time: new Date(form.end_time).toISOString() }
      const ev = await createEvent(payload)
      location.href = `/events/${ev.checkin_token}`
    } catch(err:any){ setError(err.message) }
  }

  return (
    <div>
      <Nav />
      <form onSubmit={onSubmit} className="max-w-xl m-4 p-4 rounded-2xl shadow grid gap-3">
        <h1 className="text-xl font-semibold">Create Event</h1>
        {error && <div className="text-red-600 text-sm" role="alert">{error}</div>}
        <label className="grid">Name<input className="border rounded p-2" value={form.name} onChange={e=>update('name', e.target.value)} required /></label>
        <label className="grid">Location<input className="border rounded p-2" value={form.location} onChange={e=>update('location', e.target.value)} required /></label>
        <label className="grid">Start Time<input type="datetime-local" className="border rounded p-2" value={form.start_time} onChange={e=>update('start_time', e.target.value)} required /></label>
        <label className="grid">End Time<input type="datetime-local" className="border rounded p-2" value={form.end_time} onChange={e=>update('end_time', e.target.value)} required /></label>
        <label className="grid">Notes<textarea className="border rounded p-2" value={form.notes} onChange={e=>update('notes', e.target.value)} /></label>
        <button className="bg-black text-white rounded p-2">Create</button>
      </form>
    </div>
  )
}
```

## frontend/src/pages/EventDetailPage.tsx
```tsx
import React from 'react'
import { useParams } from '../router'
import Nav from '../components/Nav'
import { getByToken } from '../api/events'
import type { EventOut } from '../types'
import QRCode from 'qrcode'

export default function EventDetailPage(){
  const { token } = useParams()
  const [event, setEvent] = React.useState<EventOut | null>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  React.useEffect(()=>{ (async()=>{
    const e = await getByToken(token)
    setEvent(e)
    if (canvasRef.current) QRCode.toCanvas(canvasRef.current, location.origin+`/checkin?token=${e.checkin_token}`)
  })() },[token])

  if(!event) return <div>Loading…</div>
  return (
    <div>
      <Nav />
      <div className="p-4 grid gap-4 place-items-center">
        <h1 className="text-2xl font-bold">{event.name}</h1>
        <div className="text-gray-600">Scan to check in</div>
        <canvas ref={canvasRef} className="bg-white p-4 rounded"></canvas>
        <div className="text-sm">{new Date(event.start_time).toLocaleString()} – {new Date(event.end_time).toLocaleString()} @ {event.location}</div>
      </div>
    </div>
  )
}
```

## frontend/src/pages/CheckInPage.tsx
```tsx
import React from 'react'
import { useSearch } from '../router'
import { checkIn } from '../api/events'
import Protected from '../components/Protected'

export default function CheckInPage(){
  const { token } = useSearch()
  const [state, setState] = React.useState<'idle'|'ok'|'err'>('idle')
  const [msg, setMsg] = React.useState('')
  React.useEffect(()=>{ (async()=>{
    try{ await checkIn(token); setState('ok'); setMsg('Checked in!') }
    catch(e:any){ setState('err'); setMsg(e.message) }
  })() },[token])
  return (
    <Protected>
      <div className="min-h-screen grid place-items-center p-4">
        <div className={`p-6 rounded-2xl shadow ${state==='ok'?'border-green-500 border':'border-gray-200 border'}`}>
          <h1 className="text-xl font-semibold mb-2">Event Check-In</h1>
          <p>{msg || 'Processing…'}</p>
        </div>
      </div>
    </Protected>
  )
}
```

## frontend/src/App.tsx
```tsx
import React from 'react'
import Protected from './components/Protected'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import EventFormPage from './pages/EventFormPage'
import EventDetailPage from './pages/EventDetailPage'
import CheckInPage from './pages/CheckInPage'

// Minimal router helpers
function usePath(){ return location.pathname }
export function useParams(){
  const path = usePath()
  const m = path.match(/\/events\/(.+)$/)
  return { token: m? m[1]: '' }
}
export function useSearch(){
  const p = new URLSearchParams(location.search)
  return { token: p.get('token') || '' }
}

export { useParams as useParams_compat, useSearch as useSearch_compat }

export default function App(){
  const path = usePath()
  if(path.startsWith('/login')) return <LoginPage />
  if(path.startsWith('/events/new')) return <Protected><EventFormPage /></Protected>
  if(path.startsWith('/events/')) return <Protected><EventDetailPage /></Protected>
  if(path.startsWith('/checkin')) return <CheckInPage />
  return <Protected><DashboardPage /></Protected>
}
```

## frontend/test_setup.ts
```ts
import '@testing-library/jest-dom'
```

## frontend/src/test/LoginPage.test.tsx
```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LoginPage from '../pages/LoginPage'

vi.stubGlobal('fetch', vi.fn(async (input: any, init?: any)=>{
  if(String(input).includes('/auth/login')) return new Response(JSON.stringify({ access_token:'t' }), { headers: { 'content-type':'application/json' } })
  return new Response('{}', { headers: { 'content-type':'application/json' } })
}))

vi.stubGlobal('location', { href: '/', origin: 'http://localhost' } as any)

it('logs in with demo creds', async () => {
  render(<LoginPage />)
  fireEvent.click(screen.getByText('Sign in'))
  await waitFor(()=> expect(localStorage.getItem('token')).toBe('t'))
})
```

## frontend/src/test/EventFlow.test.tsx
```tsx
import { render, screen } from '@testing-library/react'
import EventDetailPage from '../pages/EventDetailPage'

vi.stubGlobal('fetch', vi.fn(async (input: any)=>{
  if(String(input).includes('/events/by-token/abc')){
    return new Response(JSON.stringify({ id:1, name:'E', location:'L', start_time: new Date().toISOString(), end_time: new Date(Date.now()+3600000).toISOString(), notes:null, checkin_open_minutes: 15, checkin_token:'abc', attendance_count:0 }), { headers: { 'content-type':'application/json' } })
  }
  return new Response('{}', { headers: { 'content-type':'application/json' } })
}))

vi.stubGlobal('location', { origin: 'http://localhost', pathname:'/events/abc' } as any)

vi.mock('../router', ()=> ({ useParams: ()=>({ token: 'abc' }) }))

it('renders QR page shell', async () => {
  render(<EventDetailPage />)
  expect(await screen.findByText('E')).toBeInTheDocument()
})
```

---

## infra/docker/backend.Dockerfile
```dockerfile
# ---- build stage ----
FROM python:3.11-slim AS builder
WORKDIR /app
COPY backend/pyproject.toml backend/pytest.ini backend/alembic.ini /app/
COPY backend/app /app/app
COPY backend/alembic /app/alembic
RUN pip install --no-cache-dir pipx && pipx ensurepath || true
RUN pip install --no-cache-dir .[dev]

# ---- runtime ----
FROM python:3.11-slim
ENV PYTHONUNBUFFERED=1 \
    PORT=8000 \
    DATABASE_URL=sqlite:///./app.db
WORKDIR /app
COPY --from=builder /usr/local /usr/local
COPY backend /app
RUN useradd -m appuser && chown -R appuser /app
USER appuser
EXPOSE 8000
CMD alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## infra/docker/frontend.Dockerfile
```dockerfile
# ---- build ----
FROM node:20-alpine AS build
WORKDIR /app
COPY frontend/package.json frontend/vite.config.ts frontend/tsconfig.json frontend/postcss.config.cjs /app/
COPY frontend/index.html /app/index.html
COPY frontend/src /app/src
RUN corepack enable && corepack prepare pnpm@9.7.0 --activate && pnpm install && pnpm build

# ---- serve ----
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY infra/docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

## infra/docker/nginx.conf
```nginx
server {
  listen 80;
  server_name _;

  root /usr/share/nginx/html;
  index index.html;

  location /api/ {
    proxy_pass http://backend:8000/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }

  location / {
    try_files $uri /index.html;
  }
}
```

## docker-compose.yml
```yaml
version: '3.9'
services:
  backend:
    build:
      context: .
      dockerfile: infra/docker/backend.Dockerfile
    environment:
      - DATABASE_URL=${DATABASE_URL:-sqlite:///./app.db}
      - SECRET_KEY=${SECRET_KEY:-dev-secret}
      - CORS_ORIGIN=http://localhost:8080
    volumes:
      - dbdata:/app
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:8000/docs"]
      interval: 10s
      timeout: 3s
      retries: 10

  frontend:
    build:
      context: .
      dockerfile: infra/docker/frontend.Dockerfile
    environment:
      - VITE_API_URL=/api
    ports:
      - "8080:80"
    depends_on:
      backend:
        condition: service_healthy

volumes:
  dbdata:
```

## README.md
```md
# QR Check‑In System (FastAPI + React/Vite)

A minimal, production‑ready scaffold to let organizers create events, generate QR codes, and let attendees scan to check in. Includes CSV export, time‑window enforcement, tests with ≥80% coverage targets, and Dockerized deployment behind Nginx.

## Tech
- **Backend:** FastAPI, SQLAlchemy 2.x, Alembic, JWT auth (testing rule: password == username part of email), pytest + coverage
- **Frontend:** Vite + React + TS + Tailwind v4 (via `@tailwindcss/postcss`), RTL + Vitest + MSW (optional), QR generation via `qrcode`
- **Infra:** Docker multi‑stage builds + `docker-compose` (Nginx static + proxy to backend)

## Running Locally

### 1) Backend
```bash
python -m venv .venv && source .venv/bin/activate
pip install -e backend/.[dev]
export DATABASE_URL=sqlite:///./app.db
uvicorn app.main:app --reload --app-dir backend
```
Visit http://localhost:8000/docs

### 2) Frontend
```bash
cd frontend
corepack enable && corepack prepare pnpm@9.7.0 --activate
pnpm install
pnpm dev
```
Visit http://localhost:5173

### Demo Login
- Organizer: `grayj@wofford.edu` / `grayj`
- Attendee: `student1@wofford.edu` / `student1`

## Tests & Coverage

### Backend
```bash
cd backend
pytest -q --cov=app --cov-report=term-missing:skip-covered --cov-report=html --cov-fail-under=80
```
HTML report in `backend/htmlcov/index.html`.

### Frontend
```bash
cd frontend
pnpm test:cov
```
Coverage report in `frontend/coverage/index.html`.

## Docker

```bash
docker compose up --build
```
- Frontend at http://localhost:8080
- Backend internal at `backend:8000`, proxied via Nginx at `/api/`

### Switching to Postgres
1. Uncomment/add a `postgres` service in `docker-compose.yml` (optional) and set `DATABASE_URL=postgresql+psycopg://user:pass@postgres:5432/dbname` for backend.
2. Add `psycopg[binary]` to backend dependencies if needed.
3. Run `alembic upgrade head` (the backend container does this on start).

## Notes
- Check‑in window opens `checkin_open_minutes` (default 15) **before** start and closes at end.
- Event QR payload is a URL: `/checkin?token=...`. Attendees must be logged in to complete check‑in.
- CSV export route: `GET /api/v1/events/{id}/attendance.csv` (organizer only).

## Roadmap
- Wofford SSO integration
- Admin console for org/user management
- Anti‑cheat: rotating tokens, GPS/Bluetooth geofencing, one‑time links
- Attendance detail views and CSV column enrichment (names/emails)
