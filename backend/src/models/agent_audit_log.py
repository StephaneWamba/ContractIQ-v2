import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Integer, func
from sqlalchemy.orm import Mapped, mapped_column
from src.core.database import Base


class AgentAuditLog(Base):
    """Records every file tool call the agent makes — GDPR data access audit trail."""
    __tablename__ = "agent_audit_logs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    document_id: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    tool: Mapped[str] = mapped_column(String, nullable=False)
    input_summary: Mapped[str | None] = mapped_column(String, nullable=True)
    result_chars: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
