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
from src.models.document import Document, DocumentStatus
from src.models.workspace import Workspace
from src.models.audit_log import AuditAction
from src.agents.contract_agent import ContractAgent
from src.services.workspace_tools import WorkspaceToolkit

router = APIRouter(prefix="/conversations", tags=["conversations"])


class AskRequest(BaseModel):
    question: str
    document_id: str | None = None
    workspace_id: str


class AnalyzeRequest(BaseModel):
    document_id: str


@router.post("/ask")
@limiter.limit("50/hour")
async def ask(
    request: Request,
    body: AskRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Q&A over workspace contracts. Streams SSE via autonomous agent."""
    ws = await db.execute(
        select(Workspace).where(
            Workspace.id == body.workspace_id,
            Workspace.owner_id == current_user.id,
        )
    )
    if not ws.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Access denied")

    await log_action(
        db, current_user.id, AuditAction.QA_QUERY,
        resource_type="workspace", resource_id=body.workspace_id,
        ip_address=request.client.host if request.client else None,
    )
    await db.commit()

    agent = ContractAgent()
    toolkit = WorkspaceToolkit(workspace_id=body.workspace_id, db=db)

    async def stream():
        async for chunk in agent.ask(
            toolkit=toolkit,
            question=body.question,
            document_id=body.document_id,
        ):
            yield chunk

    return StreamingResponse(stream(), media_type="text/event-stream")


@router.post("/analyze")
@limiter.limit("10/hour")
async def analyze(
    request: Request,
    body: AnalyzeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Re-run autonomous analysis on a processed document. Streams SSE."""
    result = await db.execute(
        select(Document)
        .join(Workspace, Document.workspace_id == Workspace.id)
        .where(Document.id == body.document_id, Workspace.owner_id == current_user.id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.status != DocumentStatus.READY:
        raise HTTPException(status_code=400, detail="Document not yet processed")

    await log_action(
        db, current_user.id, AuditAction.AI_REVIEW,
        resource_type="document", resource_id=body.document_id,
        ip_address=request.client.host if request.client else None,
    )
    await db.commit()

    agent = ContractAgent()
    toolkit = WorkspaceToolkit(workspace_id=doc.workspace_id, db=db)

    async def stream():
        async for chunk in agent.analyze_document(
            toolkit=toolkit,
            document_id=body.document_id,
            filename=doc.filename,
            contract_type=doc.contract_type.value,
            party_perspective=doc.party_perspective.value,
        ):
            yield chunk

    return StreamingResponse(stream(), media_type="text/event-stream")
