from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.api.deps import get_db, require_any_role
from app.models.user import UserRole, User
from app.models.audit_log import AuditLog

router = APIRouter()

# Example AuditLog model (adjust fields as needed)
from pydantic import BaseModel

class AuditLogOut(BaseModel):
    id: int
    action: str
    user_email: str
    timestamp: datetime
    resource_type: str | None = None
    resource_id: str | None = None
    details: str | None = None
    ip_address: str | None = None
    comment: str | None = None

    class Config:
        orm_mode = True

# Real DB query for audit logs
@router.get("/", response_model=List[AuditLogOut])
def list_audit_logs(db: Session = Depends(get_db), admin: User = Depends(require_any_role(UserRole.ADMIN))):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).all()
    return logs
