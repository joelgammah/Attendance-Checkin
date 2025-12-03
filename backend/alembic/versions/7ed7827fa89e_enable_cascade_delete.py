"""enable cascade delete

Revision ID: 7ed7827fa89e
Revises: 1edbbcaea996
Create Date: 2025-12-02 19:06:44.275352

"""
"""Enable CASCADE DELETE on users for events and attendances"""

revision = "7ed7827fa89e"
down_revision = "1edbbcaea996"
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa


def upgrade():
    # --- EVENTS.organizer_id -> users.id ON DELETE CASCADE ---
    op.drop_constraint(
        "events_organizer_id_fkey",
        "events",
        type_="foreignkey"
    )
    op.create_foreign_key(
        "events_organizer_id_fkey",
        "events",
        "users",
        ["organizer_id"],
        ["id"],
        ondelete="CASCADE",
    )

    # --- ATTENDANCES.attendee_id -> users.id ON DELETE CASCADE ---
    op.drop_constraint(
        "attendances_attendee_id_fkey",
        "attendances",
        type_="foreignkey"
    )
    op.create_foreign_key(
        "attendances_attendee_id_fkey",
        "attendances",
        "users",
        ["attendee_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade():
    # --- Reverse EVENTS.organizer_id ---
    op.drop_constraint(
        "events_organizer_id_fkey",
        "events",
        type_="foreignkey"
    )
    op.create_foreign_key(
        "events_organizer_id_fkey",
        "events",
        "users",
        ["organizer_id"],
        ["id"],
        ondelete=None
    )

    # --- Reverse ATTENDANCES.attendee_id ---
    op.drop_constraint(
        "attendances_attendee_id_fkey",
        "attendances",
        type_="foreignkey"
    )
    op.create_foreign_key(
        "attendances_attendee_id_fkey",
        "attendances",
        "users",
        ["attendee_id"],
        ["id"],
        ondelete=None
    )
