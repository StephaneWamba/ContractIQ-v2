import uuid
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
from src.models.workspace import Workspace
from src.models.conversation import Conversation, ConversationMessage
from src.models.audit_log import AuditAction
from src.agents.rag_agent import RAGAgent
from src.agents.review_agent import ReviewAgent

router = APIRouter(prefix="/conversations", tags=["conversations"])


class AskRequest(BaseModel):
    question: str
    document_id: str | None = None
    workspace_id: str


@router.post("/ask")
@limiter.limit("50/hour")
async def ask(
    request: Request,
    body: AskRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Q&A via RAG with Citations API. Streams SSE."""
    # Ownership check
    ws_result = await db.execute(
        select(Workspace).where(Workspace.id == body.workspace_id, Workspace.owner_id == current_user.id)
    )
    if not ws_result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Access denied")

    await log_action(db, current_user.id, AuditAction.QA_QUERY,
                    resource_type="workspace", resource_id=body.workspace_id,
                    ip_address=request.client.host if request.client else None)
    await db.commit()

    rag = RAGAgent()

    async def stream():
        async for chunk in rag.query_stream(
            db=db,
            workspace_id=body.workspace_id,
            question=body.question,
            document_id=body.document_id,
        ):
            yield chunk

    return StreamingResponse(stream(), media_type="text/event-stream")


class ReviewRequest(BaseModel):
    document_id: str


@router.post("/review")
@limiter.limit("5/hour")
async def review(
    request: Request,
    body: ReviewRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Full contract review via Agent SDK + Skills. Streams SSE."""
    # Get document with ownership check
    result = await db.execute(
        select(Document)
        .join(Workspace, Document.workspace_id == Workspace.id)
        .where(Document.id == body.document_id, Workspace.owner_id == current_user.id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    from src.models.document import DocumentStatus
    if doc.status != DocumentStatus.READY:
        raise HTTPException(status_code=400, detail="Document not yet processed")

    # Get clauses
    from src.models.clause import Clause
    clauses_result = await db.execute(
        select(Clause).where(Clause.document_id == body.document_id)
    )
    clauses = clauses_result.scalars().all()
    clauses_list = [
        {
            "clause_type": c.clause_type.value,
            "text": c.original_text,
            "risk_level": c.risk_level.value,
            "risk_reasoning": c.risk_reasoning,
        }
        for c in clauses
    ]

    await log_action(db, current_user.id, AuditAction.AI_REVIEW,
                    resource_type="document", resource_id=body.document_id,
                    ip_address=request.client.host if request.client else None)
    await db.commit()

    agent = ReviewAgent()

    async def stream():
        async for chunk in agent.review_stream(
            contract_type=doc.contract_type.value if doc.contract_type else "generic",
            party_perspective=doc.party_perspective.value if doc.party_perspective else "unknown",
            summary=doc.summary or "",
            clauses=clauses_list,
            missing_clauses=doc.missing_clauses or [],
            contract_excerpt="",  # full text no longer stored; worker used it
        ):
            yield chunk

    return StreamingResponse(stream(), media_type="text/event-stream")
