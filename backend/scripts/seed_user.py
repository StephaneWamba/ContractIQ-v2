"""One-time script: creates a demo user + workspace for testing."""
import asyncio
import uuid
from src.core.database import AsyncSessionLocal
from src.models.user import User
from src.models.workspace import Workspace
from src.core.auth import hash_password
from src.services.playbook_service import seed_workspace_playbooks


async def main():
    async with AsyncSessionLocal() as db:
        uid = str(uuid.uuid4())
        wid = str(uuid.uuid4())
        user = User(
            id=uid,
            email="demo@contractiq.app",
            full_name="Demo User",
            hashed_password=hash_password("Demo1234"),
        )
        workspace = Workspace(
            id=wid,
            name="Demo Workspace",
            owner_id=uid,
        )
        db.add(user)
        db.add(workspace)
        await db.commit()
        await seed_workspace_playbooks(wid)
        print(f"Created user {uid} workspace {wid}")


if __name__ == "__main__":
    asyncio.run(main())
