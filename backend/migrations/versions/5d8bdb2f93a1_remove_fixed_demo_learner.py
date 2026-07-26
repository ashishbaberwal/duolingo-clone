"""remove fixed demo learner

Revision ID: 5d8bdb2f93a1
Revises: 97eb8618f192
Create Date: 2026-07-26 21:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "5d8bdb2f93a1"
down_revision: str | Sequence[str] | None = "97eb8618f192"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Remove the assignment-only account and its cascading learner data."""
    users = sa.table("users", sa.column("username", sa.String(length=50)))
    op.execute(users.delete().where(users.c.username == "learner"))


def downgrade() -> None:
    """Do not recreate credentials or learner history during downgrade."""
