"""add agent_audit_logs table

Revision ID: 003
Revises: 002
Create Date: 2026-03-29
"""
from alembic import op
import sqlalchemy as sa

revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "agent_audit_logs",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("workspace_id", sa.String(), nullable=False),
        sa.Column("document_id", sa.String(), nullable=True),
        sa.Column("tool", sa.String(), nullable=False),
        sa.Column("input_summary", sa.String(), nullable=True),
        sa.Column("result_chars", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_agent_audit_logs_workspace_id", "agent_audit_logs", ["workspace_id"])
    op.create_index("ix_agent_audit_logs_document_id", "agent_audit_logs", ["document_id"])
    op.create_index("ix_agent_audit_logs_created_at", "agent_audit_logs", ["created_at"])


def downgrade() -> None:
    op.drop_table("agent_audit_logs")
