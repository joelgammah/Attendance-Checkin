from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
import os

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)


def get_url():
    return os.getenv("DATABASE_URL", config.get_main_option("sqlalchemy.url"))


from app.models.base import Base  # noqa: E402
from app.models.user import User  # noqa: F401
from app.models.organization import Organization  # noqa: F401
from app.models.event import Event  # noqa: F401
from app.models.attendance import Attendance  # noqa: F401

target_metadata = Base.metadata


def run_migrations_offline():
    url = get_url()
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    connectable = engine_from_config(
        {"sqlalchemy.url": get_url()},
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
