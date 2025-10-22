from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.session import SessionLocal
from app.repositories.user_repo import UserRepository
import jwt
from typing import Callable
from app.models.user import User, UserRole


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


def require_any_role(*roles: UserRole) -> Callable[[User], User]:
    """Dependency that requires the current user to have at least one of the specified roles"""
    def _dep(current_user: User = Depends(get_current_user)) -> User:
        if not current_user.has_any_role(roles):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
        return current_user
    return _dep
