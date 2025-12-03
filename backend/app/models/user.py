from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String
from app.models.base import Base, IDMixin
import enum
from typing import Iterable, Optional


class UserRole(str, enum.Enum):
    ATTENDEE = "attendee"
    ORGANIZER = "organizer"
    ADMIN = "admin"


class User(IDMixin, Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    password_hash: Mapped[str] = mapped_column(String(255))
    auth0_sub: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True)

    events = relationship("Event", back_populates="organizer",    cascade="all, delete-orphan", passive_deletes=True)
    role_assignments = relationship("UserRoleAssignment", back_populates="user", cascade="all, delete-orphan", lazy="selectin", passive_deletes=True)
    attendances = relationship("Attendance", back_populates="attendee", cascade="all, delete-orphan", passive_deletes=True,)


    def roles(self) -> set[UserRole]:
        """Get all roles for this user from role_assignments"""
        vals: set[UserRole] = set()
        # Add from role assignments
        for ra in self.role_assignments:
            try:
                vals.add(UserRole(ra.role))
            except (ValueError, AttributeError):
                pass
        return vals

    def has_any_role(self, roles: Iterable[UserRole]) -> bool:
        """Check if user has any of the given roles"""
        current_roles = self.roles()
        return any(r in current_roles for r in roles)

    def add_role(self, role: UserRole) -> None:
        """Add a role to this user if not already present"""
        if not self.has_role(role):
            from app.models.user_role import UserRoleAssignment
            self.role_assignments.append(UserRoleAssignment(role=role.value))

    def remove_role(self, role: UserRole) -> None:
        """Remove a role from this user"""
        self.role_assignments = [ra for ra in self.role_assignments if ra.role != role.value]

    def has_role(self, role: UserRole) -> bool:
        """Check if user has a specific role"""
        return role in self.roles()

    def primary_role(self) -> UserRole:
        """Get primary role with precedence: admin > organizer > attendee"""
        current_roles = self.roles()
        if UserRole.ADMIN in current_roles:
            return UserRole.ADMIN
        elif UserRole.ORGANIZER in current_roles:
            return UserRole.ORGANIZER
        elif UserRole.ATTENDEE in current_roles:
            return UserRole.ATTENDEE
        else:
            return UserRole.ATTENDEE  # fallback
