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
