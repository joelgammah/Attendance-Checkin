from fastapi import APIRouter
from app.core.config import settings
from app.api.v1 import auth, events, users, audit_logs


api_router = APIRouter(prefix=settings.API_V1_PREFIX)
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(events.router, prefix="/events", tags=["events"])
api_router.include_router(audit_logs.router, prefix="/audit_logs", tags=["audit-logs"])
