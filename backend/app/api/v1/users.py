from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.api.deps import get_current_user


router = APIRouter()


class MeResponse(BaseModel):
    id: int
    email: str
    name: str
    role: str
    roles: list[str] | None = None
    primary_role: str | None = None


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
