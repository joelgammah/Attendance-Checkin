import pytest
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.repositories.audit_log_repo import AuditLogRepository
from app.models.audit_log import AuditLog

class TestAuditLogRepository:
    @pytest.fixture
    def repo(self):
        return AuditLogRepository()

    def test_log_audit_minimal(self, db: Session, repo):
        """Test logging with only required fields."""
        action = "TEST_ACTION"
        user_email = "test@example.com"

        log = repo.log_audit(db, action=action, user_email=user_email)

        # Assertions
        assert isinstance(log, AuditLog)
        assert log.id is not None  # DB should assign an ID
        assert log.action == action
        assert log.user_email == user_email
        assert isinstance(log.timestamp, datetime)  # default optional
        assert log.resource_type is None
        assert log.resource_id is None
        assert log.details is None
        assert log.ip_address is None

    def test_log_audit_full(self, db: Session, repo):
        """Test logging with all fields provided."""
        timestamp = datetime.now(timezone.utc).replace(tzinfo=None)
        log = repo.log_audit(
            db,
            action="FULL_ACTION",
            user_email="full@example.com",
            timestamp=timestamp,
            resource_type="EVENT",
            resource_id="42",
            details="Some detail text",
            ip_address="127.0.0.1",
        )

        assert isinstance(log, AuditLog)
        assert log.id is not None
        assert log.action == "FULL_ACTION"
        assert log.user_email == "full@example.com"
        assert log.timestamp == timestamp
        assert log.resource_type == "EVENT"
        assert log.resource_id == "42"
        assert log.details == "Some detail text"
        assert log.ip_address == "127.0.0.1"
