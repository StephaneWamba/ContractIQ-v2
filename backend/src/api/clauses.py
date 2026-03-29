from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.core.database import get_db
from src.core.auth import get_current_user
from src.core.rate_limit import limiter
from src.core.audit import log_action
from src.models.user import User
from src.models.document import Document
from src.models.clause import Clause, RiskLevel
from src.models.workspace import Workspace
from src.models.audit_log import AuditAction
from src.agents.rag_agent import RAGAgent
from src.agents.review_agent import ReviewAgent

router = APIRouter(prefix="/clauses", tags=["clauses"])


@router.get("")
async def list_clauses(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _verify_document_access(document_id, current_user.id, db)
    result = await db.execute(
        select(Clause)
        .where(Clause.document_id == document_id)
        .order_by(Clause.page_number.asc().nullslast())
    )
    clauses = result.scalars().all()
    return [
        {
            "id": c.id,
            "clause_type": c.clause_type.value,
            "original_text": c.original_text,
            "page_number": c.page_number,
            "risk_level": c.risk_level.value,
            "risk_reasoning": c.risk_reasoning,
            "jurisdiction_note": c.jurisdiction_note,
        }
        for c in clauses
    ]


@router.patch("/{clause_id}")
async def update_clause(
    clause_id: str,
    body: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """User correction: update clause_type, risk_level, risk_reasoning."""
    result = await db.execute(
        select(Clause)
        .join(Document, Clause.document_id == Document.id)
        .join(Workspace, Document.workspace_id == Workspace.id)
        .where(Clause.id == clause_id, Workspace.owner_id == current_user.id)
    )
    clause = result.scalar_one_or_none()
    if not clause:
        raise HTTPException(status_code=404, detail="Clause not found")

    allowed = {"risk_level", "risk_reasoning", "clause_type"}
    for key, value in body.items():
        if key in allowed:
            if key == "risk_level":
                try:
                    value = RiskLevel(value.upper())
                except ValueError:
                    raise HTTPException(status_code=400, detail=f"Invalid risk_level: {value}")
            if key == "clause_type":
                from src.models.clause import ClauseType
                try:
                    value = ClauseType(value.upper())
                except ValueError:
                    raise HTTPException(status_code=400, detail=f"Invalid clause_type: {value}")
            setattr(clause, key, value)

    await db.commit()
    return {"id": clause_id, "updated": True}


async def _verify_document_access(document_id: str, user_id: str, db: AsyncSession) -> Document:
    result = await db.execute(
        select(Document)
        .join(Workspace, Document.workspace_id == Workspace.id)
        .where(Document.id == document_id, Workspace.owner_id == user_id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc
