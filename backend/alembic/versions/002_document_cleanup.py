"""document cleanup: drop unused columns, add md_path, add workspace region

Revision ID: 002
Revises: 001
Create Date: 2026-03-29
"""
from alembic import op
import sqlalchemy as sa

revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop unused document columns
    op.drop_column("documents", "anthropic_file_id")
    op.drop_column("documents", "chunk_count")
    op.drop_column("documents", "missing_clauses")
    op.drop_column("documents", "summary")
    # Add new columns
    op.add_column("documents", sa.Column("md_path", sa.String(), nullable=True))
    op.add_column("workspaces", sa.Column("region", sa.String(), nullable=False, server_default="us"))
    # Drop clauses table (replaced by analysis.md in GCS)
    op.drop_table("clauses")


def downgrade() -> None:
    op.add_column("documents", sa.Column("anthropic_file_id", sa.String(), nullable=True))
    op.add_column("documents", sa.Column("chunk_count", sa.Integer(), nullable=True))
    op.add_column("documents", sa.Column("missing_clauses", sa.JSON(), nullable=True))
    op.add_column("documents", sa.Column("summary", sa.Text(), nullable=True))
    op.drop_column("documents", "md_path")
    op.drop_column("workspaces", "region")
