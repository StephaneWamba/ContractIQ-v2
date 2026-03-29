from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.core.database import get_db
from src.core.auth import get_current_user
from src.models.user import User
from src.models.workspace import Workspace

router = APIRouter(prefix="/workspaces", tags=["workspaces"])


@router.get("")
async def list_workspaces(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Workspace).where(Workspace.owner_id == current_user.id))
    workspaces = result.scalars().all()
    return [{"id": w.id, "name": w.name, "created_at": w.created_at} for w in workspaces]
