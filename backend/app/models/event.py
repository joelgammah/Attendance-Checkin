from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, ForeignKey, DateTime, Integer, Boolean, JSON
from typing import List
from app.models.base import Base, IDMixin
from datetime import datetime


class Event(IDMixin, Base):
    __tablename__ = "events"

    name: Mapped[str] = mapped_column(String(255))
    location: Mapped[str] = mapped_column(String(255))
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    notes: Mapped[str | None] = mapped_column(String(2000), default=None)
    checkin_open_minutes: Mapped[int] = mapped_column(Integer, default=15)
    checkin_token: Mapped[str] = mapped_column(String(64), unique=True, index=True)

    #recurring logic
    recurring: Mapped[bool] = mapped_column(Boolean, default=False)
    weekdays: Mapped[List[str] | None] = mapped_column(JSON, default=None)
    end_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    parent_id: Mapped[int | None] = mapped_column(Integer, default=None)

    #attendance threshold
    attendance_threshold: Mapped[int | None] = mapped_column(Integer, default=None)
    

    organizer_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    organizer = relationship("User", back_populates="events", passive_deletes=True)
    members = relationship("EventMember", back_populates="event", cascade="all, delete-orphan")

    attendances = relationship("Attendance", back_populates="event", cascade="all, delete-orphan")
