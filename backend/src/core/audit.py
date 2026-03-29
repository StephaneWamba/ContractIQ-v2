from sqlalchemy.ext.asyncio import AsyncSession
from src.models.audit_log import AuditLog, AuditAction


async def log_action(
    db: AsyncSession,
    user_id: str | None,
    action: AuditAction,
    resource_type: str | None = None,
    resource_id: str | None = None,
    ip_address: str | None = None,
    outcome: str = "success",
    metadata: dict | None = None,
) -> None:
    entry = AuditLog(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        ip_address=ip_address,
        outcome=outcome,
        metadata_=metadata,
    )
    db.add(entry)
    await db.flush()
