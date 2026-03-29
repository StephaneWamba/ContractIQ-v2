from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.core.database import get_db
from src.core.auth import get_current_user
from src.core.rate_limit import limiter
from src.models.user import User
from src.models.workspace import Workspace
from src.services.playbook_service import seed_workspace_playbooks
from src.services.gcs_service import GCSService
from src.services.workspace_tools import WorkspaceToolkit

router = APIRouter(prefix="/workspaces", tags=["workspaces"])


@router.get("")
async def list_workspaces(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Workspace).where(Workspace.owner_id == current_user.id))
    workspaces = result.scalars().all()
    return [{"id": w.id, "name": w.name, "created_at": w.created_at} for w in workspaces]


@router.get("/{workspace_id}/playbooks/{contract_type}")
async def get_playbook(
    workspace_id: str,
    contract_type: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ws = await db.execute(
        select(Workspace).where(Workspace.id == workspace_id, Workspace.owner_id == current_user.id)
    )
    if not ws.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Access denied")
    gcs = GCSService()
    path = f"workspaces/{workspace_id}/skills/playbook-{contract_type}.md"
    content = await gcs.read_text(path)
    if content is None:
        raise HTTPException(status_code=404, detail="Playbook not found")
    return {"contract_type": contract_type, "content": content}


class PlaybookUpdateRequest(BaseModel):
    content: str = Field(..., min_length=10, max_length=50_000)


@router.put("/{workspace_id}/playbooks/{contract_type}")
async def update_playbook(
    workspace_id: str,
    contract_type: str,
    body: PlaybookUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ws = await db.execute(
        select(Workspace).where(Workspace.id == workspace_id, Workspace.owner_id == current_user.id)
    )
    if not ws.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Access denied")
    gcs = GCSService()
    path = f"workspaces/{workspace_id}/skills/playbook-{contract_type}.md"
    await gcs.write_text(path, body.content)
    return {"updated": True, "path": path}


@router.get("/{workspace_id}/search")
@limiter.limit("30/hour")
async def search_workspace(
    request: Request,
    workspace_id: str,
    q: str,
    mode: str = "fuzzy",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Search across all contracts. mode: exact | regex | fuzzy | semantic"""
    ws = await db.execute(
        select(Workspace).where(Workspace.id == workspace_id, Workspace.owner_id == current_user.id)
    )
    if not ws.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Access denied")
    if not q or len(q.strip()) < 2:
        raise HTTPException(status_code=400, detail="Query too short")

    toolkit = WorkspaceToolkit(workspace_id=workspace_id, db=db)

    if mode == "semantic":
        results = await toolkit.semantic_search(query=q, n_results=15)
        return {
            "mode": "semantic",
            "results": [
                {"document_id": r.document_id, "page": r.page_number, "text": r.text, "score": r.similarity}
                for r in results
            ],
        }
    else:
        matches = await toolkit.grep(
            query=q,
            path_pattern="documents/*/contract.md",
            mode=mode,
            max_results=30,
        )
        return {
            "mode": mode,
            "results": [
                {"path": m.path, "line": m.line_number, "text": m.line, "score": m.score}
                for m in matches
            ],
        }
