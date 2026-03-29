import uuid
import enum
from datetime import datetime
from sqlalchemy import String, DateTime, Integer, ForeignKey, Boolean, JSON, func, Enum as SAEnum, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.core.database import Base


class DocumentStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"


class ContractType(str, enum.Enum):
    SAAS_AGREEMENT = "saas_agreement"
    EMPLOYMENT = "employment"
    NDA = "nda"
    MSA = "msa"
    SOW = "sow"
    IP_LICENSE = "ip_license"
    GENERIC = "generic"


class PartyPerspective(str, enum.Enum):
    VENDOR = "vendor"
    CUSTOMER = "customer"
    EMPLOYER = "employer"
    EMPLOYEE = "employee"
    LICENSOR = "licensor"
    LICENSEE = "licensee"
    UNKNOWN = "unknown"


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(String, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    filename: Mapped[str] = mapped_column(String, nullable=False)
    original_filename: Mapped[str] = mapped_column(String, nullable=False)
    file_size: Mapped[int | None] = mapped_column(Integer, nullable=True)
    page_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[DocumentStatus] = mapped_column(SAEnum(DocumentStatus), default=DocumentStatus.PENDING, index=True)
    contract_type: Mapped[ContractType] = mapped_column(SAEnum(ContractType), default=ContractType.GENERIC)
    party_perspective: Mapped[PartyPerspective] = mapped_column(SAEnum(PartyPerspective), default=PartyPerspective.UNKNOWN)
    # Storage
    gcs_path: Mapped[str | None] = mapped_column(String, nullable=True)
    anthropic_file_id: Mapped[str | None] = mapped_column(String, nullable=True)
    # Processing state
    chunk_count: Mapped[int | None] = mapped_column(Integer, nullable=True)  # null = not yet indexed
    truncated: Mapped[bool] = mapped_column(Boolean, default=False)
    error_message: Mapped[str | None] = mapped_column(String, nullable=True)
    arq_job_id: Mapped[str | None] = mapped_column(String, nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    missing_clauses: Mapped[list | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    workspace: Mapped["Workspace"] = relationship(back_populates="documents")
    clauses: Mapped[list["Clause"]] = relationship(back_populates="document", cascade="all, delete-orphan")
    chunks: Mapped[list["DocumentChunk"]] = relationship(back_populates="document", cascade="all, delete-orphan")
    conversations: Mapped[list["Conversation"]] = relationship(back_populates="document", cascade="all, delete-orphan")
