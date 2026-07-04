"""add colour code

Revision ID: c1a2b3d4e5f6
Revises: 7d3500b99b25
Create Date: 2026-07-04 09:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c1a2b3d4e5f6'
down_revision: Union[str, None] = '7d3500b99b25'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('colours', sa.Column('code', sa.String(length=20), nullable=True))
    op.create_index(op.f('ix_colours_code'), 'colours', ['code'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_colours_code'), table_name='colours')
    op.drop_column('colours', 'code')
