"""add comment column to audit_logs

Revision ID: c1a2b3c4d5e6
Revises: 4c10382c68a3
Create Date: 2025-11-20
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'c1a2b3c4d5e6'
down_revision = '4c10382c68a3'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('audit_logs', sa.Column('comment', sa.String(), nullable=True))


def downgrade():
    op.drop_column('audit_logs', 'comment')
