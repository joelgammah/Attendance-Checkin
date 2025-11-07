from sqlalchemy.orm import Session
from sqlalchemy import select
from app.repositories.base import BaseRepository
from app.models.user import User


class UserRepository(BaseRepository[User]):
    def __init__(self):
        super().__init__(User)

    def get_by_email(self, db: Session, email: str) -> User | None:
        return db.execute(select(User).where(User.email == email)).scalar_one_or_none()

    def get_by_auth0_sub(self, db: Session, auth0_sub: str) -> User | None:
        """Get user by Auth0 subject ID."""
        return db.execute(select(User).where(User.auth0_sub == auth0_sub)).scalar_one_or_none()

    def delete(self, db: Session, user_id: int) -> bool:
        """Delete user by ID."""
        user = db.execute(select(User).where(User.id == user_id)).scalar_one_or_none()
        if user:
            db.delete(user)
            return True
        return False
