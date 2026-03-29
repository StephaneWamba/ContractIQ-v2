import uuid
import enum
from datetime import datetime
from sqlalchemy import String, DateTime, Float, Integer, JSON, ForeignKey, func, Enum as SAEnum, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.core.database import Base


class ClauseType(str, enum.Enum):
    PAYMENT = "PAYMENT"
    TERMINATION = "TERMINATION"
    LIABILITY = "LIABILITY"
    CONFIDENTIALITY = "CONFIDENTIALITY"
    IP_OWNERSHIP = "IP_OWNERSHIP"
    DISPUTE_RESOLUTION = "DISPUTE_RESOLUTION"
    FORCE_MAJEURE = "FORCE_MAJEURE"
    REPRESENTATIONS = "REPRESENTATIONS"
    INDEMNIFICATION = "INDEMNIFICATION"
    WARRANTIES = "WARRANTIES"
    NON_COMPETE = "NON_COMPETE"
    NON_SOLICITATION = "NON_SOLICITATION"
    SEVERANCE = "SEVERANCE"
    DATA_PROCESSING = "DATA_PROCESSING"
    SECURITY = "SECURITY"
    RETENTION = "RETENTION"
    CHANGE_ORDER = "CHANGE_ORDER"
    ACCEPTANCE_CRITERIA = "ACCEPTANCE_CRITERIA"
    AUDIT_RIGHTS = "AUDIT_RIGHTS"
    KEY_PERSONNEL = "KEY_PERSONNEL"
    BENCHMARKING = "BENCHMARKING"
    MFN = "MFN"
    ENTIRE_AGREEMENT = "ENTIRE_AGREEMENT"
    AMENDMENT = "AMENDMENT"
    ASSIGNMENT = "ASSIGNMENT"
    NOTICE = "NOTICE"
    WAIVER = "WAIVER"
    SURVIVAL = "SURVIVAL"
    GOVERNING_LAW = "GOVERNING_LAW"
    LIQUIDATED_DAMAGES = "LIQUIDATED_DAMAGES"
    OTHER = "OTHER"


class RiskLevel(str, enum.Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFO = "INFO"


class Clause(Base):
    __tablename__ = "clauses"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id: Mapped[str] = mapped_column(String, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    clause_type: Mapped[ClauseType] = mapped_column(SAEnum(ClauseType, native_enum=False), nullable=False, index=True)
    title: Mapped[str | None] = mapped_column(String, nullable=True)
    original_text: Mapped[str] = mapped_column(Text, nullable=False)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    risk_level: Mapped[RiskLevel] = mapped_column(SAEnum(RiskLevel, native_enum=False), default=RiskLevel.INFO, index=True)
    risk_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    risk_reasoning: Mapped[str | None] = mapped_column(Text, nullable=True)
    page_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    flags: Mapped[list] = mapped_column(JSON, nullable=True, default=list)
    parties: Mapped[list] = mapped_column(JSON, nullable=True, default=list)
    jurisdiction_note: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    document: Mapped["Document"] = relationship(back_populates="clauses")
