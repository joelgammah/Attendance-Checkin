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


# Seed demo users on startup (idempotent)
# Note: Tables should be created via Alembic migrations (alembic upgrade head)
@app.on_event("startup")
def on_startup():
    try:
        with Session(bind=engine) as db:
            # Check if users already exist (idempotent seeding)
            if not db.query(User).count():
                # Seed with tuple of (email, name, roles_list)
                demo = [
                    ("grayj@wofford.edu", "John Gray", [UserRole.ORGANIZER, UserRole.ATTENDEE]),
                    ("clublead@wofford.edu", "Club Lead", [UserRole.ORGANIZER]),
                    ("martincs@wofford.edu", "Collin Martin", [UserRole.ATTENDEE]),
                    ("podrebarackc@wofford.edu", "Kate Podrebarac", [UserRole.ATTENDEE]),
                    ("gammahja@wofford.edu", "Joel Gammah", [UserRole.ATTENDEE]),
                    ("garrettal@wofford.edu", "Aaron Garrett", [UserRole.ORGANIZER, UserRole.ATTENDEE]),  # Professor with multi-role
                    ("adminterrier@wofford.edu", "Admin Terrier", [UserRole.ADMIN, UserRole.ORGANIZER, UserRole.ATTENDEE])
                ]
                for email, name, roles in demo:
                    # Create user
                    u = User(email=email, name=name, password_hash=get_password_hash(email.split("@")[0]))
                    db.add(u)
                    db.flush()  # Get the ID
                    
                    # Add all roles to user_roles table
                    for role in roles:
                        db.add(UserRoleAssignment(user_id=u.id, role=role.value))
                
                db.commit()
                print("✅ Demo users seeded successfully")
            else:
                print("ℹ️  Users already exist, skipping seed")
    except Exception as e:
        print(f"⚠️  Startup seeding failed: {e}")
        print("   Make sure to run 'alembic upgrade head' to create tables first!")
