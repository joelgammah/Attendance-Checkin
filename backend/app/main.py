from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.router import api_router
from app.db.session import engine
from app.models.base import Base
from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from app.models.user_role import UserRoleAssignment
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
            # Seed with tuple of (email, name, roles_list)
            demo = [
                ("grayj@wofford.edu", "John Gray", [UserRole.ORGANIZER]),
                ("clublead@wofford.edu", "Club Lead", [UserRole.ORGANIZER]),
                ("martincs@wofford.edu", "Collin Martin", [UserRole.ATTENDEE]),
                ("podrebarackc@wofford.edu", "Kate Podrebarac", [UserRole.ATTENDEE]),
                ("gammahja@wofford.edu", "Joel Gammah", [UserRole.ATTENDEE]),
                ("garrettal@wofford.edu", "Aaron Garrett", [UserRole.ORGANIZER, UserRole.ATTENDEE]),  # Professor with multi-role
            ]
            for email, name, roles in demo:
                # Use first role as legacy primary role
                u = User(email=email, name=name, role=roles[0], password_hash=get_password_hash(email.split("@")[0]))
                db.add(u)
                db.flush()  # Get the ID
                
                # Add all roles to user_roles table
                for role in roles:
                    db.add(UserRoleAssignment(user_id=u.id, role=role.value))
            
            db.commit()
        else:
            # Backfill existing users (one-time migration)
            users = db.query(User).all()
            for u in users:
                if not any(ra.role == u.role.value for ra in u.role_assignments):
                    db.add(UserRoleAssignment(user_id=u.id, role=u.role.value))
            db.commit()
