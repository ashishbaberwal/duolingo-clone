"""add user password hash

Revision ID: 97eb8618f192
Revises: 2bca21859cef
Create Date: 2026-07-26 18:10:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "97eb8618f192"
down_revision: str | Sequence[str] | None = "2bca21859cef"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Add an unusable credential marker for existing user rows."""
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                "password_hash",
                sa.String(length=255),
                nullable=False,
                server_default="!",
            )
        )

    # Use a second operation so SQLite copies existing rows with the temporary
    # marker before rebuilding the table without a database-level default.
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.alter_column("password_hash", server_default=None)


def downgrade() -> None:
    """Remove stored password hashes."""
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.drop_column("password_hash")
