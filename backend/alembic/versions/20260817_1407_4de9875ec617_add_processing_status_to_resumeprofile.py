"""Add processing_status to ResumeProfile

Revision ID: 4de9875ec617
Revises: 001
Create Date: 2026-08-17 14:07:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4de9875ec617'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add processing_status to resume_profiles
    op.add_column('resume_profiles', sa.Column('processing_status', sa.String(length=20), nullable=False, server_default='completed'))


def downgrade() -> None:
    # Drop processing_status from resume_profiles
    op.drop_column('resume_profiles', 'processing_status')
