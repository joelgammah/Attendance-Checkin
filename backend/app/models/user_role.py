from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, ForeignKey, UniqueConstraint
from app.models.base import Base, IDMixin


class UserRoleAssignment(IDMixin, Base):
    __tablename__ = "user_roles"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    role: Mapped[str] = mapped_column(String(32), index=True)

    user = relationship("User", back_populates="role_assignments")

    __table_args__ = (
        UniqueConstraint("user_id", "role", name="uq_user_role"),
    )