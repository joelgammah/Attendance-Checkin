from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.api.deps import get_current_user, get_db, require_any_role
from app.models.user import User, UserRole
from app.repositories.user_repo import UserRepository
from app.repositories.audit_log_repo import AuditLogRepository
from passlib.context import CryptContext
from datetime import datetime


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
router = APIRouter()
user_repo = UserRepository()


class MeResponse(BaseModel):
    id: int
    email: str
    name: str
    role: str
    roles: list[str] | None = None
    primary_role: str | None = None

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    roles: list[UserRole] = [UserRole.ATTENDEE]


@router.get("/me", response_model=MeResponse)
def me(user = Depends(get_current_user)):
    all_roles = sorted([r.value for r in user.roles()])
    primary_role = user.primary_role().value
    
    return MeResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role.value,  # Keep legacy for compatibility
        roles=all_roles,
        primary_role=primary_role
    )


# --- ADMIN ENDPOINTS ---

class UserOut(BaseModel):
    id: int
    email: str
    name: str
    roles: list[str]


@router.get("/", response_model=list[UserOut])
def list_users(
    db: Session = Depends(get_db),
    admin: User = Depends(require_any_role(UserRole.ADMIN))
):
    users = db.query(User).all()
    return [
        UserOut(
            id=u.id,
            email=u.email,
            name=u.name,
            roles=[r.value for r in u.roles()]
        ) for u in users
    ]


@router.post("/{user_id}/promote")
def promote_to_organizer(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_any_role(UserRole.ADMIN))
):
    user = db.query(User).get(user_id)
    if not user:
        raise HTTPException(404, "User not found")
    user.add_role(UserRole.ORGANIZER)
    db.commit()
    AuditLogRepository.log_audit(
        db,
        action="promote_to_organizer",
        user_email=admin.email,
        timestamp=datetime.utcnow(),
        resource_type="user",
        resource_id=str(user.id),
        details=f"Promoted to organizer: {user.email}"
    )
    return {"detail": "User promoted to organizer"}


@router.post("/{user_id}/revoke-organizer")
def revoke_organizer(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_any_role(UserRole.ADMIN))
):
    user = db.query(User).get(user_id)
    if not user:
        raise HTTPException(404, "User not found")
    user.remove_role(UserRole.ORGANIZER)
    db.commit()
    AuditLogRepository.log_audit(
        db,
        action="revoke_organizer",
        user_email=admin.email,
        timestamp=datetime.utcnow(),
        resource_type="user",
        resource_id=str(user.id),
        details=f"Revoked organizer: {user.email}"
    )
    return {"detail": "Organizer role revoked"}


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_any_role(UserRole.ADMIN))
):
    user = db.query(User).get(user_id)
    if not user:
        raise HTTPException(404, "User not found")
    db.delete(user)
    db.commit()
    AuditLogRepository.log_audit(
        db,
        action="delete_user",
        user_email=admin.email,
        timestamp=datetime.utcnow(),
        resource_type="user",
        resource_id=str(user.id),
        details=f"Deleted user: {user.email}"
    )
    return {"detail": "User deleted"}

@router.post("/", status_code=201)
def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_any_role(UserRole.ADMIN))
):
    # Check if user already exists
    if db.query(User).filter(User.email == user_in.email).first():
        raise HTTPException(status_code=400, detail="User already exists")
    hashed_password = pwd_context.hash(user_in.password)
    user = User(
        name=user_in.name,
        email=user_in.email,
        role=user_in.roles[0] if user_in.roles else UserRole.ATTENDEE,
        password_hash=hashed_password,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    # Assign roles
    for role in user_in.roles:
        user.add_role(role)
    db.commit()
    AuditLogRepository.log_audit(
        db,
        action="create_user",
        user_email=admin.email,
        timestamp=datetime.utcnow(),
        resource_type="user",
        resource_id=str(user.id),
        details=f"Created user: {user.email}"
    )
    return {"id": user.id, "email": user.email, "name": user.name, "roles": [r.role for r in user.role_assignments]}
