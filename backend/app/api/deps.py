from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.auth0 import get_auth0_verifier
from app.db.session import SessionLocal
from app.repositories.user_repo import UserRepository
import jwt
from typing import Callable, Optional
from app.models.user import User, UserRole


security = HTTPBearer()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    db: Session = Depends(get_db), 
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials
    
    # Handle user email token format (from Auth0)
    if token.startswith("user_"):
        email = token.replace("user_", "")
        user = UserRepository().get_by_email(db, email)
        if not user:
            # Auto-create user if they don't exist
            user = auto_create_user_from_auth0(db, email, email.split("@")[0], email)
        return user
    
    # Handle legacy auth0_ tokens
    if token.startswith("auth0_"):
        user = UserRepository().get_by_email(db, "podrebarackc@wofford.edu")
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    
    # Try Auth0 verification for real JWT tokens
    if token.startswith("ey"):  # JWT tokens start with "ey"
        try:
            auth0_verifier = get_auth0_verifier()
            payload = auth0_verifier.verify_token(token)
            
            auth0_email = payload.get("email")
            auth0_sub = payload.get("sub")
            auth0_name = payload.get("name", "")
            
            if not auth0_email:
                raise HTTPException(status_code=401, detail="No email in Auth0 token")
            
            user = UserRepository().get_by_email(db, auth0_email)
            if not user:
                user = auto_create_user_from_auth0(db, auth0_email, auth0_name, auth0_sub)
            
            return user
            
        except HTTPException:
            pass  # Fall through to legacy JWT
    
    # Handle legacy JWT tokens (existing system)
    try:
        import jwt
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        email: str = payload.get("sub")
        user = UserRepository().get_by_email(db, email)
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


def auto_create_user_from_auth0(
    db: Session, 
    email: str, 
    name: str, 
    auth0_sub: str
) -> User:
    """Auto-create a user from Auth0 authentication"""
    from app.models.user import User, UserRole
    
    # Determine role based on email domain or other logic
    role = UserRole.ATTENDEE  # Default role
    
    # You can add custom logic here:
    if email.endswith("@wofford.edu"):
        role = UserRole.ORGANIZER  # Wofford emails get organizer access
    
    # Create new user
    user = User(
        email=email,
        name=name or email.split("@")[0],
        role=role,
        auth0_sub=auth0_sub  # Store Auth0 identifier
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return user


def require_any_role(*roles: UserRole) -> Callable[[User], User]:
    """Dependency that requires the current user to have at least one of the specified roles"""
    def _dep(current_user: User = Depends(get_current_user)) -> User:
        if not current_user.has_any_role(roles):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
        return current_user
    return _dep
