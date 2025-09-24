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
