from app.models.audit_log import AuditLog
from sqlalchemy.orm import Session
from typing import Optional

class AuditLogRepository:
    @staticmethod
    def log_audit(
        db: Session,
        *,
        action: str,
        user_email: str,
        timestamp: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        details: Optional[str] = None,
        ip_address: Optional[str] = None,
        comment: Optional[str] = None,
    ):
        log = AuditLog(
            action=action,
            user_email=user_email,
            timestamp=timestamp,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details,
            ip_address=ip_address,
            comment=comment,
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return log
