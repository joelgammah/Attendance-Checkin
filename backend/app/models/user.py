from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Enum
from app.models.base import Base, IDMixin
import enum


class UserRole(str, enum.Enum):
    ATTENDEE = "attendee"
    ORGANIZER = "organizer"
    ADMIN = "admin"


class User(IDMixin, Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.ATTENDEE)
    password_hash: Mapped[str] = mapped_column(String(255))

    events = relationship("Event", back_populates="organizer")
