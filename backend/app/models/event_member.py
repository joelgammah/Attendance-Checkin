from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey, DateTime, UniqueConstraint
from app.models.base import Base, IDMixin
from datetime import datetime, timezone

class EventMember(IDMixin, Base):
    __tablename__ = "event_members"
    
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    event = relationship("Event", back_populates="members")
    user = relationship("User")
    
    __table_args__ = (
        UniqueConstraint('event_id', 'user_id', name='uq_event_user'),
    )