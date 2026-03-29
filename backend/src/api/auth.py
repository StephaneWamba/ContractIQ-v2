import uuid
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.core.database import get_db
from src.core.auth import hash_password, verify_password, create_access_token, get_current_user
from src.core.rate_limit import limiter
from src.core.audit import log_action
from src.models.user import User
from src.models.workspace import Workspace
from src.models.audit_log import AuditAction

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("3/hour")
async def register(request: Request, body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Check email unique
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        id=str(uuid.uuid4()),
        email=body.email,
        full_name=body.name,
        hashed_password=hash_password(body.password),
    )
    db.add(user)

    # Create default workspace
    workspace = Workspace(
        id=str(uuid.uuid4()),
        name=f"{body.name}'s Workspace",
        owner_id=user.id,
    )
    db.add(workspace)
    await db.commit()

    token = create_access_token(user.id)
    await db.commit()
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login(request: Request, form: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == form.username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(form.password, user.hashed_password):
        await log_action(db, None, AuditAction.LOGIN, ip_address=request.client.host if request.client else None, outcome="failure")
        await db.commit()
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(user.id)
    await log_action(db, user.id, AuditAction.LOGIN, ip_address=request.client.host if request.client else None)
    await db.commit()
    return TokenResponse(access_token=token)


@router.get("/me")
async def me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "email": current_user.email, "name": current_user.full_name}
