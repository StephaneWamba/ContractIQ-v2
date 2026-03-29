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
    """Q&A endpoint — to be implemented in Task 9."""
    raise HTTPException(status_code=501, detail="Not implemented — pending agent rewrite")
