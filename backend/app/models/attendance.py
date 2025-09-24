from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, ForeignKey, DateTime, UniqueConstraint
from app.models.base import Base, IDMixin
from datetime import datetime


class Attendance(IDMixin, Base):
    __tablename__ = "attendances"
    __table_args__ = (UniqueConstraint("event_id", "attendee_id", name="uq_event_attendee"),)

    event_id: Mapped[int] = mapped_column(ForeignKey("events.id"))
    attendee_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    checked_in_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    source_ip: Mapped[str | None] = mapped_column(String(64))
    user_agent: Mapped[str | None] = mapped_column(String(255))

    event = relationship("Event", back_populates="attendances")
