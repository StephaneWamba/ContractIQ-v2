"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-03-29

"""
from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector

revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Enable pgvector extension
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    # users
    op.create_table(
        'users',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('full_name', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
    )
    op.create_index('ix_users_email', 'users', ['email'])

    # workspaces
    op.create_table(
        'workspaces',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('owner_id', sa.String(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_workspaces_owner_id', 'workspaces', ['owner_id'])

    # documents
    op.create_table(
        'documents',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('workspace_id', sa.String(), sa.ForeignKey('workspaces.id', ondelete='CASCADE'), nullable=False),
        sa.Column('filename', sa.String(), nullable=False),
        sa.Column('original_filename', sa.String(), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=True),
        sa.Column('page_count', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(), nullable=False, server_default='pending'),
        sa.Column('contract_type', sa.String(), nullable=False, server_default='generic'),
        sa.Column('party_perspective', sa.String(), nullable=False, server_default='unknown'),
        sa.Column('gcs_path', sa.String(), nullable=True),
        sa.Column('anthropic_file_id', sa.String(), nullable=True),
        sa.Column('chunk_count', sa.Integer(), nullable=True),
        sa.Column('truncated', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('error_message', sa.String(), nullable=True),
        sa.Column('arq_job_id', sa.String(), nullable=True),
        sa.Column('summary', sa.Text(), nullable=True),
        sa.Column('missing_clauses', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_documents_workspace_id', 'documents', ['workspace_id'])
    op.create_index('ix_documents_status', 'documents', ['status'])

    # document_chunks (replaces ChromaDB)
    op.create_table(
        'document_chunks',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('document_id', sa.String(), sa.ForeignKey('documents.id', ondelete='CASCADE'), nullable=False),
        sa.Column('workspace_id', sa.String(), sa.ForeignKey('workspaces.id', ondelete='CASCADE'), nullable=False),
        sa.Column('page_number', sa.Integer(), nullable=True),
        sa.Column('chunk_index', sa.Integer(), nullable=False),
        sa.Column('text', sa.Text(), nullable=False),
        sa.Column('embedding', Vector(1024), nullable=True),
        sa.Column('chunk_metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_document_chunks_document_id', 'document_chunks', ['document_id'])
    op.create_index('ix_document_chunks_workspace_id', 'document_chunks', ['workspace_id'])
    # IVFFlat index for cosine similarity search (voyage-law-2 = 1024 dims)
    # NOTE: IVFFlat requires trained centroids. After loading initial data (500+ rows),
    # run: REINDEX INDEX ix_document_chunks_embedding
    # to rebuild with proper centroid training for accurate similarity search.
    op.execute(
        "CREATE INDEX ix_document_chunks_embedding ON document_chunks "
        "USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)"
    )

    # clauses
    op.create_table(
        'clauses',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('document_id', sa.String(), sa.ForeignKey('documents.id', ondelete='CASCADE'), nullable=False),
        sa.Column('clause_type', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=True),
        sa.Column('original_text', sa.Text(), nullable=False),
        sa.Column('summary', sa.Text(), nullable=True),
        sa.Column('risk_level', sa.String(), nullable=False, server_default='INFO'),
        sa.Column('risk_score', sa.Float(), nullable=True),
        sa.Column('risk_reasoning', sa.Text(), nullable=True),
        sa.Column('page_number', sa.Integer(), nullable=True),
        sa.Column('flags', sa.JSON(), nullable=True),
        sa.Column('parties', sa.JSON(), nullable=True),
        sa.Column('jurisdiction_note', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_clauses_document_id', 'clauses', ['document_id'])
    op.create_index('ix_clauses_clause_type', 'clauses', ['clause_type'])
    op.create_index('ix_clauses_risk_level', 'clauses', ['risk_level'])
    op.create_index('ix_clauses_document_id_clause_type', 'clauses', ['document_id', 'clause_type'])

    # conversations
    op.create_table(
        'conversations',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('document_id', sa.String(), sa.ForeignKey('documents.id', ondelete='CASCADE'), nullable=False),
        sa.Column('workspace_id', sa.String(), sa.ForeignKey('workspaces.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_conversations_document_id', 'conversations', ['document_id'])
    op.create_index('ix_conversations_workspace_id', 'conversations', ['workspace_id'])

    # conversation_messages
    op.create_table(
        'conversation_messages',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('conversation_id', sa.String(), sa.ForeignKey('conversations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('message_index', sa.Integer(), nullable=False),
        sa.Column('role', sa.String(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('citations', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_conversation_messages_conversation_id', 'conversation_messages', ['conversation_id'])

    # audit_logs (append-only — no UPDATE/DELETE for app user)
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=True),
        sa.Column('action', sa.String(), nullable=False),
        sa.Column('resource_type', sa.String(), nullable=True),
        sa.Column('resource_id', sa.String(), nullable=True),
        sa.Column('ip_address', sa.String(), nullable=True),
        sa.Column('outcome', sa.String(), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_audit_logs_user_id', 'audit_logs', ['user_id'])
    op.create_index('ix_audit_logs_action', 'audit_logs', ['action'])


def downgrade() -> None:
    op.drop_table('audit_logs')
    op.drop_table('conversation_messages')
    op.drop_table('conversations')
    op.drop_table('clauses')
    op.drop_table('document_chunks')
    op.drop_table('documents')
    op.drop_table('workspaces')
    op.drop_table('users')
    op.execute("DROP EXTENSION IF EXISTS vector")
