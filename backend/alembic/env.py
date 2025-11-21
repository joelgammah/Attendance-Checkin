from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add the backend directory to Python path so we can import app modules
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

# Load .env file from backend directory
load_dotenv(backend_dir / ".env")

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)


def get_url():
    url = os.getenv("DATABASE_URL")
    if not url:
        raise RuntimeError("DATABASE_URL environment variable is not set!")
    return url


from app.models.base import Base  # noqa: E402
from app.models.user import User  # noqa: F401
from app.models.user_role import UserRoleAssignment  # noqa: F401
from app.models.organization import Organization  # noqa: F401
from app.models.event import Event  # noqa: F401
from app.models.attendance import Attendance  # noqa: F401
from app.models.audit_log import AuditLog  # noqa: F401
from app.models.event_member import EventMember  # noqa: F401

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
