"""Merge migration heads

Revision ID: 1edbbcaea996
Revises: c1a2b3c4d5e6, e8e998577d55
Create Date: 2025-11-21 13:05:42.719492

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1edbbcaea996'
down_revision: Union[str, Sequence[str], None] = ('c1a2b3c4d5e6', 'e8e998577d55')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
