from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from src.core.config import get_settings
from src.core.database import engine, get_db
from src.core.rate_limit import limiter
from src.api import auth, documents, conversations, workspaces


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: validate settings (pydantic already validated secret_key has no default)
    yield
    # Shutdown: dispose DB connection pool
    await engine.dispose()


app = FastAPI(
    title="ContractIQ v2",
    version="2.0.0",
    lifespan=lifespan,
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS — explicit origins, no wildcard
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/api/v2")
app.include_router(documents.router, prefix="/api/v2")
app.include_router(conversations.router, prefix="/api/v2")
app.include_router(workspaces.router, prefix="/api/v2")


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/health/ready")
async def health_ready():
    """Deep health check — tests DB connection + pgvector extension."""
    from sqlalchemy.ext.asyncio import AsyncSession
    from src.core.database import AsyncSessionLocal
    try:
        async with AsyncSessionLocal() as db:
            await db.execute(text("SELECT 1"))
            result = await db.execute(
                text("SELECT 1 FROM pg_extension WHERE extname = 'vector'")
            )
            if not result.scalar():
                return JSONResponse(status_code=503, content={"status": "unhealthy", "detail": "pgvector extension not installed"})
    except Exception as e:
        return JSONResponse(status_code=503, content={"status": "unhealthy", "detail": str(e)})
    return {"status": "ready", "db": "ok", "pgvector": "ok"}
