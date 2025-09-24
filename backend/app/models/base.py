from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import Integer


class Base(DeclarativeBase):
    pass


class IDMixin:
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
