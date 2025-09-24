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


@app.get("/healthz")
def healthz():
    return {"status": "ok"}


# Create tables & seed a few test users on startup (idempotent for SQLite)
@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    with Session(bind=engine) as db:
        if not db.query(User).count():
            demo = [
                ("grayj@wofford.edu", "John Gray", UserRole.ORGANIZER),
                ("clublead@wofford.edu", "Club Lead", UserRole.ORGANIZER),
                ("martincs@wofford.edu", "Collin Martin", UserRole.ATTENDEE),
                ("podrebarackc@wofford.edu", "Kate Podrebarac", UserRole.ATTENDEE),
                ("gammahja@wofford.edu", "Joel Gammah", UserRole.ATTENDEE),
            ]
            for email, name, role in demo:
                u = User(email=email, name=name, role=role, password_hash=get_password_hash(email.split("@")[0]))
                db.add(u)
            db.commit()
