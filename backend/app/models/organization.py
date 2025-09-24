from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String
from app.models.base import Base, IDMixin


class Organization(IDMixin, Base):
    __tablename__ = "organizations"

    name: Mapped[str] = mapped_column(String(255), unique=True)
    users = relationship("UserOrganization", back_populates="organization")
