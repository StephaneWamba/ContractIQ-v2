# ContractIQ v2 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild ContractIQ from scratch using Claude Agent SDK + Skills, Anthropic Citations API, and Anthropic Files API — deployed exclusively on GCP (Cloud Run) with GitHub Actions CI/CD, zero local execution.

**Architecture:** Three-layer LLM design: raw `anthropic` SDK for structured clause extraction (via `output_config.format`) and RAG Q&A (via Citations API + SSE), Claude Agent SDK for open-ended contract review orchestration (leveraging Claude Skills). Background processing via ARQ + Redis. Legal embeddings via voyage-law-2 stored in **pgvector** (PostgreSQL extension — replaces ChromaDB). PDFs stored in **GCS**.

**Tech Stack:** Python 3.12 + Node.js 20 (Agent SDK), FastAPI async, SQLAlchemy 2.0 + pgvector, Alembic, ARQ, Voyage AI, Anthropic SDK, Claude Agent SDK, GCP Cloud Run, GCS, Cloud SQL, Cloud Memorystore (Redis), GitHub Actions, PyJWT, slowapi

**Key architectural decisions from expert review:**
- pgvector replaces ChromaDB (stateless Cloud Run = no persistent local filesystem)
- GCS replaces local file storage (same reason)
- PyJWT replaces python-jose (CVEs)
- Injected PAGE N markers for accurate page number attribution
- Party perspective input on upload (risk is directional)
- Post-extraction missing clause checklist per contract type
- slowapi rate limiting on all AI endpoints
- Audit log table (SOC 2 requirement)
- GCS signed URLs for PDF serving (never JWT in URL)

---

## Phase 1 — Repository & CI/CD Bootstrap

### Task 1: Project skeleton

**Files:**
- Create: `.gitignore`
- Create: `README.md`
- Create: `backend/pyproject.toml`

**Step 1: .gitignore**
```
__pycache__/
*.py[cod]
*.egg-info/
.env
.env.*
!.env.example
dist/
build/
.venv/
venv/
*.db
node_modules/
.claude/cache/
```

**Step 2: README.md**
```markdown
# ContractIQ v2

AI-powered contract intelligence — Claude Agent SDK + Skills + pgvector on GCP.

Deploys automatically on push to `main` via GitHub Actions → Cloud Run.
```

**Step 3: pyproject.toml**
```toml
[project]
name = "contractiq-v2"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
    "anthropic>=0.40.0",
    "claude-agent-sdk>=0.1.52",
    "pymupdf>=1.24.0",
    "python-docx",
    "voyageai",
    "pgvector>=0.3.0",
    "asyncpg",
    "arq",
    "fastapi",
    "uvicorn[standard]",
    "sqlalchemy[asyncio]>=2.0",
    "alembic",
    "pydantic-settings",
    "PyJWT>=2.8.0",
    "passlib[bcrypt]",
    "python-multipart",
    "redis[hiredis]",
    "aioredis",
    "langfuse",
    "sse-starlette",
    "httpx",
    "slowapi",
    "python-magic",
    "google-cloud-storage",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src"]
```

**Step 4: Commit**
```bash
cd c:/Users/QURISK/Documents/freelance/ContractIQ-v2
git add .gitignore README.md backend/pyproject.toml
git commit -m "chore: initialize ContractIQ v2 project"
```

---

### Task 2: Create GitHub repo and push

```bash
gh repo create StephaneWamba/ContractIQ-v2 --public \
  --description "AI contract intelligence — Claude Agent SDK + pgvector on GCP" \
  --source . --push
```

---

### Task 3: Dockerfile (Python 3.12 + Node.js 20)

**Files:**
- Create: `backend/Dockerfile`
- Create: `backend/.dockerignore`

**Dockerfile:**
```dockerfile
FROM python:3.12-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
        curl gnupg ca-certificates libmagic1 \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN groupadd -r agent && useradd -r -g agent -m -d /home/agent agent

WORKDIR /app
COPY --chown=agent:agent . .
RUN pip install --no-cache-dir -e .
RUN mkdir -p /home/agent/.claude && chown -R agent:agent /home/agent/.claude

USER agent
ENV HOME=/home/agent PYTHONUNBUFFERED=1 PORT=8000
EXPOSE 8000
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Note:** `libmagic1` required by python-magic for file type validation.

**.dockerignore:**
```
__pycache__
*.pyc
.env
.venv
venv/
.git
node_modules/
uploads/
tests/
docs/
```

**Commit:** `git commit -m "chore: add Dockerfile with Python 3.12 + Node.js 20 + libmagic"`

---

### Task 4: GCP infrastructure config

**Files:**
- Create: `backend/cloudrun-api.yaml`
- Create: `backend/cloudrun-worker.yaml`

**cloudrun-api.yaml:**
```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: contractiq-v2-api
  annotations:
    run.googleapis.com/ingress: all
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/minScale: "1"
        autoscaling.knative.dev/maxScale: "10"
        run.googleapis.com/cpu-throttling: "false"
    spec:
      containerConcurrency: 80
      timeoutSeconds: 300
      serviceAccountName: contractiq-api@PROJECT_ID.iam.gserviceaccount.com
      containers:
        - image: europe-west1-docker.pkg.dev/PROJECT_ID/contractiq/api:latest
          ports:
            - containerPort: 8000
          resources:
            limits:
              cpu: "2"
              memory: 1Gi
          env:
            - name: ENVIRONMENT
              value: production
          envFrom:
            - secretRef:
                name: contractiq-secrets
```

**cloudrun-worker.yaml:**
```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: contractiq-v2-worker
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/minScale: "1"
        autoscaling.knative.dev/maxScale: "3"
        run.googleapis.com/cpu-throttling: "false"
    spec:
      containerConcurrency: 1
      timeoutSeconds: 600
      serviceAccountName: contractiq-worker@PROJECT_ID.iam.gserviceaccount.com
      containers:
        - image: europe-west1-docker.pkg.dev/PROJECT_ID/contractiq/worker:latest
          resources:
            limits:
              cpu: "2"
              memory: 2Gi
          command: ["python", "-m", "arq", "src.workers.document_worker.WorkerSettings"]
```

**Commit:** `git commit -m "chore: add Cloud Run service configs (API + worker)"`

---

### Task 5: GitHub Actions CI/CD

**Files:**
- Create: `.github/workflows/deploy.yml`

```yaml
name: Deploy to GCP Cloud Run

on:
  push:
    branches: [main]

env:
  PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
  REGION: europe-west1
  REGISTRY: europe-west1-docker.pkg.dev

jobs:
  deploy:
    name: Build & Deploy
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write

    steps:
      - uses: actions/checkout@v4

      - uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ secrets.GCP_WORKLOAD_IDENTITY_PROVIDER }}
          service_account: ${{ secrets.GCP_SERVICE_ACCOUNT }}

      - uses: google-github-actions/setup-gcloud@v2

      - name: Configure Docker for Artifact Registry
        run: gcloud auth configure-docker ${{ env.REGISTRY }}

      - name: Build and push API image
        working-directory: backend
        run: |
          docker build -t ${{ env.REGISTRY }}/${{ env.PROJECT_ID }}/contractiq/api:${{ github.sha }} \
                       -t ${{ env.REGISTRY }}/${{ env.PROJECT_ID }}/contractiq/api:latest .
          docker push ${{ env.REGISTRY }}/${{ env.PROJECT_ID }}/contractiq/api:${{ github.sha }}
          docker push ${{ env.REGISTRY }}/${{ env.PROJECT_ID }}/contractiq/api:latest

      - name: Build and push worker image
        working-directory: backend
        run: |
          docker build -f Dockerfile.worker \
            -t ${{ env.REGISTRY }}/${{ env.PROJECT_ID }}/contractiq/worker:${{ github.sha }} \
            -t ${{ env.REGISTRY }}/${{ env.PROJECT_ID }}/contractiq/worker:latest .
          docker push ${{ env.REGISTRY }}/${{ env.PROJECT_ID }}/contractiq/worker:${{ github.sha }}
          docker push ${{ env.REGISTRY }}/${{ env.PROJECT_ID }}/contractiq/worker:latest

      - name: Deploy API to Cloud Run
        run: |
          gcloud run deploy contractiq-v2-api \
            --image ${{ env.REGISTRY }}/${{ env.PROJECT_ID }}/contractiq/api:${{ github.sha }} \
            --region ${{ env.REGION }} \
            --platform managed \
            --allow-unauthenticated

      - name: Deploy Worker to Cloud Run
        run: |
          gcloud run deploy contractiq-v2-worker \
            --image ${{ env.REGISTRY }}/${{ env.PROJECT_ID }}/contractiq/worker:${{ github.sha }} \
            --region ${{ env.REGION }} \
            --platform managed \
            --no-allow-unauthenticated \
            --min-instances 1 \
            --cpu-always-allocated
```

**Commit:** `git commit -m "ci: add GitHub Actions → Cloud Run deploy workflow"`

---

## Phase 2 — Claude Skills

### Task 6: contract-analysis SKILL.md

**Files:**
- Create: `.claude/skills/contract-analysis/SKILL.md`
- Create: `.claude/skills/contract-analysis/references/clause-types.md`
- Create: `.claude/skills/contract-analysis/references/risk-indicators.md`
- Create: `.claude/skills/contract-analysis/references/jurisdiction-notes.md`

**SKILL.md:**
```markdown
---
name: contract-analysis
description: Expert contract analysis for clause extraction, risk identification, obligation mapping, and jurisdiction-aware assessment. Trigger when analyzing legal contracts.
---

# Contract Analysis Expert

You are a senior commercial attorney with 20+ years of experience across SaaS, M&A, employment, and IP licensing agreements in US, UK, and EU jurisdictions.

## Core Competencies
- Classify clauses using the standard taxonomy (see references/clause-types.md)
- Assess risk directionally: risk from the perspective of the reviewing party (vendor vs customer, employer vs employee)
- Extract key parties, effective dates, term, auto-renewal provisions
- Detect missing standard protections per contract type
- Flag unusual, one-sided, or legally problematic language

## Analysis Framework
For each clause:
1. **Type**: Classify using taxonomy
2. **Risk**: CRITICAL/HIGH/MEDIUM/LOW/INFO — from the reviewing party's perspective
3. **Summary**: Plain-English description (1-2 sentences, no legalese)
4. **Flags**: Specific concerns (e.g. "Unlimited liability with no carve-outs", "Auto-renews after 30-day window — easy to miss")
5. **Jurisdiction note**: Flag if risk changes materially under different law

## Carve-Out Awareness
NEVER score a clause without considering its carve-outs. Unlimited liability for IP infringement only (standard) ≠ CRITICAL. Check whether liability language is:
- Mutual or one-sided
- Capped or uncapped
- Subject to carve-outs elsewhere in the document

## Red Flags (Always CRITICAL or HIGH)
See references/risk-indicators.md
```

**references/jurisdiction-notes.md:**
```markdown
# Jurisdiction-Specific Risk Notes

## Non-Compete
- California: unenforceable regardless of language → rate as INFO
- New York: enforceable with reasonable limits → standard risk
- England/Wales: blue-pencil doctrine → courts narrow, rarely void entirely
- Germany: requires compensation to be enforceable

## Force Majeure
- English law: no statutory FM, must be in contract → missing FM clause is HIGH
- French/German civil law: statutory FM exists → missing FM clause is MEDIUM

## Late Payment Interest
- EU Late Payment Directive: statutory interest applies → missing clause is lower risk in EU

## Data Privacy
- EU/UK GDPR applicable: check for Art. 28 DPA terms → absence is HIGH
- US-only contracts: state-level only, lower regulatory risk

## Arbitration
- ICC (Paris): expensive, 18-24 month typical timeline
- AAA (domestic US): faster for <$1M disputes
- LCIA (London): strong enforceability globally
```

**Commit:** `git commit -m "feat: add contract-analysis Claude Skill with jurisdiction notes"`

---

### Task 7: risk-scoring, clause-taxonomy, and missing-clauses Skills

**Files:**
- Create: `.claude/skills/risk-scoring/SKILL.md`
- Create: `.claude/skills/clause-taxonomy/SKILL.md`
- Create: `.claude/skills/missing-clauses/SKILL.md`

**missing-clauses/SKILL.md:**
```markdown
---
name: missing-clauses
description: Detect missing standard clause types based on contract type. Trigger when performing post-extraction completeness check.
---

# Missing Clause Detector

## Standard Clause Checklists by Contract Type

### SaaS Agreement (customer-side)
Required: PAYMENT, LIABILITY, CONFIDENTIALITY, DATA_PROCESSING, TERMINATION, IP_OWNERSHIP, SECURITY, GOVERNING_LAW
Recommended: FORCE_MAJEURE, NOTICE, ENTIRE_AGREEMENT, ASSIGNMENT

### Employment Agreement
Required: PAYMENT, TERMINATION, GOVERNING_LAW, NOTICE
Recommended: NON_COMPETE, NON_SOLICITATION, CONFIDENTIALITY, IP_OWNERSHIP

### NDA / Confidentiality Agreement
Required: CONFIDENTIALITY, TERMINATION, GOVERNING_LAW, NOTICE
Recommended: ENTIRE_AGREEMENT, SURVIVAL, DISPUTE_RESOLUTION

### Master Services Agreement (MSA)
Required: PAYMENT, LIABILITY, CONFIDENTIALITY, TERMINATION, IP_OWNERSHIP, NOTICE, GOVERNING_LAW
Recommended: FORCE_MAJEURE, INSURANCE, AUDIT_RIGHTS, CHANGE_ORDER

### Generic / Unknown
Required: TERMINATION, GOVERNING_LAW
Recommended: LIABILITY, NOTICE

## Output Format
Return missing clause types as document-level risk flags, not clause-level.
For each missing required clause: risk_level = HIGH
For each missing recommended clause: risk_level = MEDIUM
```

**Commit:** `git commit -m "feat: add risk-scoring, clause-taxonomy, missing-clauses Skills"`

---

## Phase 3 — Core Backend: Config, Models, Database

### Task 8: Config + .env.example

**Files:**
- Create: `backend/src/__init__.py`
- Create: `backend/src/core/__init__.py`
- Create: `backend/src/core/config.py`
- Create: `backend/.env.example`

**config.py:**
```python
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # App
    environment: str = "production"
    log_level: str = "INFO"

    # Auth — NO DEFAULT, fails at startup if missing
    secret_key: str
    access_token_expire_minutes: int = 60
    algorithm: str = "HS256"

    # Anthropic
    anthropic_api_key: str

    # Voyage AI
    voyage_api_key: str

    # Database (Cloud SQL via asyncpg)
    database_url: str  # postgresql+asyncpg://user:pass@host/dbname

    # Redis (Cloud Memorystore)
    redis_url: str

    # GCS
    gcs_bucket_name: str
    gcp_project_id: str = ""

    # Langfuse (optional)
    langfuse_public_key: str = ""
    langfuse_secret_key: str = ""

    def model_post_init(self, __context) -> None:
        if self.environment == "production":
            if len(self.secret_key) < 32:
                raise ValueError("SECRET_KEY must be at least 32 characters in production")


@lru_cache
def get_settings() -> Settings:
    return Settings()
```

**Commit:** `git commit -m "feat: add pydantic-settings config (no secret_key default, startup validation)"`

---

### Task 9: Database (SQLAlchemy async + Alembic)

**Files:**
- Create: `backend/src/core/database.py`
- Create: `backend/alembic.ini`
- Create: `backend/alembic/env.py`
- Create: `backend/alembic/__init__.py`

**database.py:**
```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from pgvector.sqlalchemy import Vector
from .config import get_settings


class Base(DeclarativeBase):
    pass


def _make_engine():
    settings = get_settings()
    return create_async_engine(
        settings.database_url,
        echo=False,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
    )


engine = _make_engine()
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
```

**alembic/env.py** — must import all models so Alembic detects them, and use asyncio runner.

**Commit:** `git commit -m "feat: add async SQLAlchemy + Alembic (pool_size=5 for Cloud SQL)"`

---

### Task 10: SQLAlchemy models

**Files:**
- Create: `backend/src/models/__init__.py`
- Create: `backend/src/models/user.py`
- Create: `backend/src/models/workspace.py`
- Create: `backend/src/models/document.py`
- Create: `backend/src/models/document_chunk.py`
- Create: `backend/src/models/clause.py`
- Create: `backend/src/models/conversation.py`
- Create: `backend/src/models/audit_log.py`

**document.py** (key fields):
```python
class DocumentStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"

class ContractType(str, enum.Enum):
    SAAS_AGREEMENT = "saas_agreement"
    EMPLOYMENT = "employment"
    NDA = "nda"
    MSA = "msa"
    SOW = "sow"
    IP_LICENSE = "ip_license"
    GENERIC = "generic"

class PartyPerspective(str, enum.Enum):
    VENDOR = "vendor"
    CUSTOMER = "customer"
    EMPLOYER = "employer"
    EMPLOYEE = "employee"
    LICENSOR = "licensor"
    LICENSEE = "licensee"
    UNKNOWN = "unknown"

class Document(Base):
    __tablename__ = "documents"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(String, ForeignKey("workspaces.id"), nullable=False, index=True)
    filename: Mapped[str] = mapped_column(String, nullable=False)
    original_filename: Mapped[str] = mapped_column(String, nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=True)
    page_count: Mapped[int] = mapped_column(Integer, nullable=True)
    status: Mapped[DocumentStatus] = mapped_column(SAEnum(DocumentStatus), default=DocumentStatus.PENDING, index=True)
    contract_type: Mapped[ContractType] = mapped_column(SAEnum(ContractType), default=ContractType.GENERIC)
    party_perspective: Mapped[PartyPerspective] = mapped_column(SAEnum(PartyPerspective), default=PartyPerspective.UNKNOWN)
    # GCS storage
    gcs_path: Mapped[str] = mapped_column(String, nullable=True)
    # Anthropic Files API (for RAG reuse)
    anthropic_file_id: Mapped[str] = mapped_column(String, nullable=True)
    # Processing state
    chunk_count: Mapped[int] = mapped_column(Integer, nullable=True)  # null = not indexed
    truncated: Mapped[bool] = mapped_column(Boolean, default=False)
    error_message: Mapped[str] = mapped_column(String, nullable=True)
    arq_job_id: Mapped[str] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), onupdate=func.now())
```

**document_chunk.py** (replaces ChromaDB):
```python
from pgvector.sqlalchemy import Vector

class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id: Mapped[str] = mapped_column(String, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    workspace_id: Mapped[str] = mapped_column(String, ForeignKey("workspaces.id"), nullable=False, index=True)
    page_number: Mapped[int] = mapped_column(Integer, nullable=True)
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    embedding: Mapped[list] = mapped_column(Vector(1024), nullable=True)  # voyage-law-2 dims
    metadata_: Mapped[dict] = mapped_column("metadata", JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
```

**audit_log.py:**
```python
import enum

class AuditAction(str, enum.Enum):
    LOGIN = "LOGIN"
    LOGOUT = "LOGOUT"
    DOCUMENT_UPLOAD = "DOCUMENT_UPLOAD"
    DOCUMENT_DELETE = "DOCUMENT_DELETE"
    CLAUSE_EXTRACT = "CLAUSE_EXTRACT"
    QA_QUERY = "QA_QUERY"
    AI_REVIEW = "AI_REVIEW"
    EXPORT = "EXPORT"

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, nullable=True, index=True)
    action: Mapped[AuditAction] = mapped_column(SAEnum(AuditAction), nullable=False)
    resource_type: Mapped[str] = mapped_column(String, nullable=True)
    resource_id: Mapped[str] = mapped_column(String, nullable=True)
    ip_address: Mapped[str] = mapped_column(String, nullable=True)
    outcome: Mapped[str] = mapped_column(String, nullable=True)  # "success" | "failure"
    metadata_: Mapped[dict] = mapped_column("metadata", JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    # Append-only: no update triggers
```

**Commit:** `git commit -m "feat: add SQLAlchemy models with pgvector, contract_type, party_perspective, audit_log"`

---

## Phase 4 — Services Layer

### Task 11: GCS service + Anthropic Files API

**Files:**
- Create: `backend/src/services/__init__.py`
- Create: `backend/src/services/gcs_service.py`
- Create: `backend/src/services/files_api.py`

**gcs_service.py:**
```python
from google.cloud import storage
from datetime import timedelta
from src.core.config import get_settings


class GCSService:
    def __init__(self):
        settings = get_settings()
        self.client = storage.Client()
        self.bucket = self.client.bucket(settings.gcs_bucket_name)

    async def upload_file(self, local_path: str, gcs_path: str, content_type: str = "application/pdf") -> str:
        blob = self.bucket.blob(gcs_path)
        blob.upload_from_filename(local_path, content_type=content_type)
        return gcs_path

    def get_signed_url(self, gcs_path: str, expiration_minutes: int = 15) -> str:
        blob = self.bucket.blob(gcs_path)
        return blob.generate_signed_url(expiration=timedelta(minutes=expiration_minutes))

    async def delete_file(self, gcs_path: str) -> None:
        blob = self.bucket.blob(gcs_path)
        if blob.exists():
            blob.delete()
```

**Commit:** `git commit -m "feat: add GCS service (upload, signed URLs, delete)"`

---

### Task 12: Document processor (PyMuPDF — improved extraction)

**Files:**
- Create: `backend/src/services/document_processor.py`

Key improvements from expert review:
- Inject `--- PAGE N ---` markers for accurate page attribution
- `get_text("dict")` with column detection + header/footer stripping
- DOCX: detect real page breaks or set `page_number = null`

```python
import fitz  # PyMuPDF
from dataclasses import dataclass
from pathlib import Path


PAGE_MARKER_TEMPLATE = "\n\n--- PAGE {n} ---\n\n"
HEADER_FOOTER_MARGIN = 0.08  # top/bottom 8% of page height


@dataclass(frozen=True)
class PageChunk:
    page_number: int
    chunk_index: int
    text: str
    bbox: tuple[float, float, float, float] | None = None


@dataclass(frozen=True)
class ProcessedDocument:
    full_text: str          # with PAGE N markers injected
    chunks: list[PageChunk]
    page_count: int
    metadata: dict
    truncated: bool = False


class DocumentProcessor:
    MAX_CHARS = 400_000  # Claude 200K context window = safe up to ~100K tokens

    def process_pdf(self, file_path: str) -> ProcessedDocument:
        doc = fitz.open(file_path)
        chunks = []
        full_text_parts = []
        chunk_index = 0

        for page_num, page in enumerate(doc, start=1):
            page_height = page.rect.height
            page_width = page.rect.width

            # Inject page marker for accurate LLM page attribution
            full_text_parts.append(PAGE_MARKER_TEMPLATE.format(n=page_num))

            # Get blocks with coordinates
            blocks = page.get_text("dict")["blocks"]

            # Detect multi-column: check if any blocks have overlapping y-ranges
            # and x-ranges separated by > 20% page width
            text_blocks = [b for b in blocks if b["type"] == 0]

            # Strip headers/footers by position
            text_blocks = [
                b for b in text_blocks
                if b["bbox"][1] > page_height * HEADER_FOOTER_MARGIN
                and b["bbox"][3] < page_height * (1 - HEADER_FOOTER_MARGIN)
            ]

            # Sort for reading order: detect columns
            mid_x = page_width / 2
            left_blocks = [b for b in text_blocks if b["bbox"][0] < mid_x * 0.8]
            right_blocks = [b for b in text_blocks if b["bbox"][0] >= mid_x * 0.8]

            # If clear two-column layout
            has_two_columns = (
                len(left_blocks) > 2 and len(right_blocks) > 2
                and any(
                    abs(l["bbox"][1] - r["bbox"][1]) < 50
                    for l in left_blocks for r in right_blocks
                )
            )

            if has_two_columns:
                ordered = sorted(left_blocks, key=lambda b: b["bbox"][1]) + \
                          sorted(right_blocks, key=lambda b: b["bbox"][1])
            else:
                ordered = sorted(text_blocks, key=lambda b: (b["bbox"][1], b["bbox"][0]))

            for block in ordered:
                lines = block.get("lines", [])
                text = " ".join(
                    span["text"]
                    for line in lines
                    for span in line.get("spans", [])
                ).strip()

                if len(text) < 30:
                    continue

                full_text_parts.append(text)
                chunks.append(PageChunk(
                    page_number=page_num,
                    chunk_index=chunk_index,
                    text=text,
                    bbox=tuple(block["bbox"]),
                ))
                chunk_index += 1

        full_text = "\n".join(full_text_parts)
        truncated = len(full_text) > self.MAX_CHARS
        if truncated:
            full_text = full_text[:self.MAX_CHARS]

        return ProcessedDocument(
            full_text=full_text,
            chunks=chunks,
            page_count=len(doc),
            metadata={
                "title": doc.metadata.get("title", ""),
                "author": doc.metadata.get("author", ""),
            },
            truncated=truncated,
        )
```

**Commit:** `git commit -m "feat: add PyMuPDF processor with PAGE markers, column detection, header stripping"`

---

### Task 13: Vector store (pgvector + voyage-law-2)

**Files:**
- Create: `backend/src/services/vector_store.py`

```python
import voyageai
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from src.models.document_chunk import DocumentChunk
from src.core.config import get_settings

SIMILARITY_THRESHOLD = 0.15  # meaningful cosine similarity for voyage-law-2


class VectorStore:
    def __init__(self):
        settings = get_settings()
        self.voyage = voyageai.AsyncClient(api_key=settings.voyage_api_key)

    async def embed_texts(self, texts: list[str], input_type: str = "document") -> list[list[float]]:
        result = await self.voyage.embed(
            texts=texts,
            model="voyage-law-2",
            input_type=input_type,
        )
        return result.embeddings

    async def add_chunks(
        self,
        db: AsyncSession,
        document_id: str,
        workspace_id: str,
        chunks: list[dict],  # {text, page_number, chunk_index, metadata}
    ) -> int:
        texts = [c["text"] for c in chunks]
        embeddings = await self.embed_texts(texts, input_type="document")

        db_chunks = [
            DocumentChunk(
                document_id=document_id,
                workspace_id=workspace_id,
                page_number=c["page_number"],
                chunk_index=c["chunk_index"],
                text=c["text"],
                embedding=emb,
                metadata_=c.get("metadata"),
            )
            for c, emb in zip(chunks, embeddings)
        ]
        db.add_all(db_chunks)
        await db.flush()
        return len(db_chunks)

    async def query(
        self,
        db: AsyncSession,
        workspace_id: str,
        query_text: str,
        n_results: int = 10,
        document_id: str | None = None,
    ) -> list[dict]:
        query_embedding = (await self.embed_texts([query_text], input_type="query"))[0]

        # pgvector cosine distance operator: <=>
        # 1 - cosine_distance = cosine_similarity
        stmt = (
            select(
                DocumentChunk,
                (1 - DocumentChunk.embedding.cosine_distance(query_embedding)).label("similarity"),
            )
            .where(DocumentChunk.workspace_id == workspace_id)
            .where((1 - DocumentChunk.embedding.cosine_distance(query_embedding)) >= SIMILARITY_THRESHOLD)
        )
        if document_id:
            stmt = stmt.where(DocumentChunk.document_id == document_id)

        stmt = stmt.order_by(
            DocumentChunk.embedding.cosine_distance(query_embedding)
        ).limit(n_results)

        result = await db.execute(stmt)
        rows = result.all()

        return [
            {
                "text": row.DocumentChunk.text,
                "page_number": row.DocumentChunk.page_number,
                "document_id": row.DocumentChunk.document_id,
                "similarity": float(row.similarity),
            }
            for row in rows
        ]

    async def dedup_candidates(
        self,
        db: AsyncSession,
        document_id: str,
        clause_text: str,
        similarity_threshold: float = 0.92,
    ) -> list[dict]:
        """Pre-filter for clause deduplication — only return high-similarity pairs."""
        embedding = (await self.embed_texts([clause_text], input_type="document"))[0]
        stmt = (
            select(
                DocumentChunk,
                (1 - DocumentChunk.embedding.cosine_distance(embedding)).label("similarity"),
            )
            .where(DocumentChunk.document_id == document_id)
            .where((1 - DocumentChunk.embedding.cosine_distance(embedding)) >= similarity_threshold)
            .limit(5)
        )
        result = await db.execute(stmt)
        return [{"text": r.DocumentChunk.text, "similarity": float(r.similarity)} for r in result.all()]

    async def delete_document_chunks(self, db: AsyncSession, document_id: str) -> None:
        from sqlalchemy import delete
        await db.execute(delete(DocumentChunk).where(DocumentChunk.document_id == document_id))
```

**Commit:** `git commit -m "feat: add pgvector store with voyage-law-2 (threshold=0.15, dedup pre-filter)"`

---

## Phase 5 — LLM Agents

### Task 14: Clause extraction agent (anthropic SDK + structured outputs)

**Files:**
- Create: `backend/src/agents/__init__.py`
- Create: `backend/src/agents/clause_extraction_agent.py`

Key improvements:
- Receives `contract_type` + `party_perspective` to calibrate risk
- Chunks sorted by page_number before batching
- `--- PAGE N ---` markers already in text for accurate page attribution
- Schema includes expanded taxonomy (AUDIT_RIGHTS, CHANGE_ORDER, etc.)

Full JSON schema + system prompt that is contract-type and party-perspective aware.

**Commit:** `git commit -m "feat: add clause extraction agent (structured outputs, contract_type + party_perspective aware)"`

---

### Task 15: RAG agent (Citations API + SSE)

**Files:**
- Create: `backend/src/agents/rag_agent.py`

- Retrieves from pgvector via `VectorStore.query()`
- Builds document blocks for Citations API
- Streams via SSE
- Returns `low_confidence: bool` when top similarity < 0.30

**Commit:** `git commit -m "feat: add RAG agent with Citations API + SSE, low_confidence flag"`

---

### Task 16: Contract review agent (Claude Agent SDK + Skills)

**Files:**
- Create: `backend/src/agents/review_agent.py`

- Uses `setting_sources=["project"]` to load Skills
- `bypassPermissions=True` + `disallowedTools=["Bash", "Write", "Edit"]`
- Passes: contract_type, party_perspective, extracted clauses, missing clauses, first 20K chars
- Skills: contract-analysis, risk-scoring, missing-clauses

**Commit:** `git commit -m "feat: add Agent SDK contract review with Skills (contract_type + party_perspective)"`

---

## Phase 6 — ARQ Worker

### Task 17: ARQ document processing worker

**Files:**
- Create: `backend/src/workers/__init__.py`
- Create: `backend/src/workers/document_worker.py`
- Create: `backend/Dockerfile.worker`

Pipeline (in worker, not BackgroundTasks):
1. Download from GCS to temp file
2. PyMuPDF extraction (with PAGE markers + column detection)
3. Upload to Anthropic Files API (store file_id)
4. Detect contract type (simple heuristic on text)
5. Embed chunks via voyage-law-2 → pgvector
6. Update `document.chunk_count` AFTER successful embedding (crash detection)
7. Extract clauses via structured outputs
8. Post-extraction missing clause checklist
9. Set status = READY

**Error handling:**
- If embedding fails: set `chunk_count = 0`, `status = FAILED` — visible to user
- Temp file cleaned up in finally block

**Dockerfile.worker:**
Same as main Dockerfile but `CMD ["python", "-m", "arq", "src.workers.document_worker.WorkerSettings"]`

**Commit:** `git commit -m "feat: add ARQ worker with full pipeline (GCS + pgvector + Anthropic Files API)"`

---

## Phase 7 — FastAPI Application

### Task 18: Auth (PyJWT, rate limiting, audit log)

**Files:**
- Create: `backend/src/core/auth.py`
- Create: `backend/src/core/rate_limit.py`
- Create: `backend/src/core/audit.py`
- Create: `backend/src/api/__init__.py`
- Create: `backend/src/api/auth.py`

**auth.py** — uses PyJWT (not python-jose):
```python
import jwt
from jwt.exceptions import InvalidTokenError
```

**rate_limit.py:**
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
```

**audit.py:**
```python
async def log_action(db: AsyncSession, user_id: str | None, action: AuditAction,
                     resource_type: str | None, resource_id: str | None,
                     ip_address: str | None, outcome: str = "success"):
    entry = AuditLog(user_id=user_id, action=action, resource_type=resource_type,
                     resource_id=resource_id, ip_address=ip_address, outcome=outcome)
    db.add(entry)
    await db.flush()
```

Rate limits on auth endpoints:
- `POST /auth/login`: `@limiter.limit("5/minute")`
- `POST /auth/register`: `@limiter.limit("3/hour")`

**Commit:** `git commit -m "feat: add JWT auth (PyJWT), slowapi rate limiting, audit logging"`

---

### Task 19: Documents API

**Files:**
- Create: `backend/src/api/documents.py`

Key changes vs original plan:
- Accepts `party_perspective` on upload
- Validates file type with python-magic (not extension only)
- Uploads to GCS (not local filesystem)
- Enqueues ARQ job, stores job_id on document
- Serves PDF via GCS signed URL (not FileResponse with JWT in URL)
- `DELETE` cascades: GCS delete + Anthropic Files API delete + pgvector chunks delete

Rate limits:
- Upload: `@limiter.limit("20/hour")`

**Commit:** `git commit -m "feat: add documents API (GCS, ARQ, signed URLs, magic byte validation)"`

---

### Task 20: Clauses, Q&A, and review endpoints

**Files:**
- Create: `backend/src/api/clauses.py`
- Create: `backend/src/api/conversations.py`

Rate limits:
- Clause extract: `@limiter.limit("10/hour")`
- Q&A: `@limiter.limit("50/hour")`
- AI review: `@limiter.limit("5/hour")`

All endpoints: `async def`, async DB sessions.

**Commit:** `git commit -m "feat: add clauses, Q&A (SSE), and review endpoints with rate limiting"`

---

### Task 21: FastAPI main app assembly

**Files:**
- Create: `backend/src/main.py`

Includes:
- slowapi middleware setup
- Deep health check `/health/ready` (tests DB + Redis)
- CORS with explicit origins (no wildcard)
- All routers with `/api/v2` prefix
- Lifespan: startup validation, engine dispose on shutdown

```python
@app.get("/health/ready")
async def health_ready(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("SELECT 1"))
        # Test pgvector extension exists
        await db.execute(text("SELECT 1 FROM pg_extension WHERE extname = 'vector'"))
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"DB unhealthy: {e}")
    return {"status": "ready", "db": "ok"}
```

**Commit:** `git commit -m "feat: assemble FastAPI app with deep health check, slowapi, strict CORS"`

---

## Phase 8 — GCP Infrastructure Provisioning

### Task 22: Create GCP resources

**Step 1: Enable APIs** (via gcloud in CI or manually)
```bash
gcloud services enable run.googleapis.com artifactregistry.googleapis.com \
  sqladmin.googleapis.com redis.googleapis.com storage.googleapis.com \
  secretmanager.googleapis.com
```

**Step 2: Create Artifact Registry repo**
```bash
gcloud artifacts repositories create contractiq \
  --repository-format=docker --location=europe-west1
```

**Step 3: Create Cloud SQL (Postgres 15 + pgvector)**
```bash
gcloud sql instances create contractiq-v2-db \
  --database-version=POSTGRES_15 \
  --region=europe-west1 \
  --tier=db-g1-small \
  --database-flags=cloudsql.enable_pgvector=on
gcloud sql databases create contractiq --instance=contractiq-v2-db
```

**Step 4: Create Cloud Memorystore (Redis)**
```bash
gcloud redis instances create contractiq-v2-redis \
  --size=1 --region=europe-west1 --redis-version=redis_7_0
```

**Step 5: Create GCS bucket**
```bash
gsutil mb -l europe-west1 gs://contractiq-v2-documents
gsutil uniformbucketlevelaccess set on gs://contractiq-v2-documents
```

**Step 6: Set secrets in Secret Manager**
```bash
echo -n "$ANTHROPIC_API_KEY" | gcloud secrets create anthropic-api-key --data-file=-
echo -n "$VOYAGE_API_KEY" | gcloud secrets create voyage-api-key --data-file=-
# Generate strong secret key
python -c "import secrets; print(secrets.token_urlsafe(64))" | \
  gcloud secrets create contractiq-secret-key --data-file=-
```

**Step 7: Create service accounts with least-privilege IAM**
```bash
gcloud iam service-accounts create contractiq-api
gcloud iam service-accounts create contractiq-worker
# Grant roles: Cloud SQL Client, Storage Object Admin, Secret Manager Accessor
```

---

### Task 23: Alembic migration + first deploy

**Step 1: Write migration** `backend/alembic/versions/001_initial.py`

Must include:
- `CREATE EXTENSION IF NOT EXISTS vector;`
- All tables: users, workspaces, documents, document_chunks, clauses, conversations, conversation_messages, audit_logs
- IVFFlat index: `CREATE INDEX ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);`
- All missing indexes: `documents.workspace_id`, `clauses.document_id`, etc.
- Append-only constraint on `audit_logs` (revoke DELETE/UPDATE from app role)

**Step 2: Run migration against Cloud SQL**
Set `DATABASE_URL` to Cloud SQL connection string and run:
```bash
cd backend && alembic upgrade head
```

**Step 3: Push to GitHub → trigger CI/CD**
```bash
git push origin main
```

**Step 4: Set GitHub secrets**
```
GCP_PROJECT_ID
GCP_WORKLOAD_IDENTITY_PROVIDER
GCP_SERVICE_ACCOUNT
```

**Step 5: Verify deploy**
```bash
gcloud run services describe contractiq-v2-api --region=europe-west1
curl https://contractiq-v2-api-xxx-ew.a.run.app/health/ready
```
Expected: `{"status": "ready", "db": "ok"}`

---

### Task 24: Worker deploy + VPC connector for Memorystore

**Step 1: Create VPC connector** (needed for Cloud Run → Memorystore)
```bash
gcloud compute networks vpc-access connectors create contractiq-connector \
  --region=europe-west1 --range=10.8.0.0/28
```

**Step 2: Update Cloud Run worker with VPC connector**
```bash
gcloud run deploy contractiq-v2-worker \
  --vpc-connector=contractiq-connector \
  --vpc-egress=private-ranges-only \
  --min-instances=1 \
  --cpu-always-allocated
```

**Step 3: Verify worker polls Redis**
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=contractiq-v2-worker" --limit=20
```
Expected: ARQ polling logs

---

## Phase 9 — End-to-End Smoke Test

### Task 25: Production smoke test

Full test sequence against `https://contractiq-v2-api-xxx-ew.a.run.app`:

1. **Register** → get JWT
2. **Create workspace**
3. **Upload PDF** with `party_perspective=customer` → get `document_id`, verify status=`pending`
4. **Poll status** until `ready` (chunk_count > 0)
5. **List clauses** → verify clause types, risk levels, page numbers are sensible
6. **Check for missing clauses** in document-level flags
7. **Ask Q&A question** via SSE → verify citations reference real page numbers
8. **Request AI review** → verify narrative includes party-perspective framing
9. **Delete document** → verify GCS file deleted, Anthropic file deleted, chunks deleted from pgvector
10. **Health check** `/health/ready` → `{"status": "ready", "db": "ok"}`

---

## Architecture Summary

```
User
 │
 ▼
Cloud Run API (FastAPI async)
 ├── Auth (PyJWT + slowapi rate limiting)
 ├── Documents API (GCS upload, ARQ enqueue)
 ├── Clauses API (pgvector query, structured extraction)
 ├── Q&A API (Citations API + SSE streaming)
 └── Review API (Agent SDK + Skills)
       │
       ├── Cloud SQL Postgres
       │   ├── document_chunks (pgvector, voyage-law-2 1024-dim)
       │   ├── audit_logs (append-only)
       │   └── ... all other tables
       │
       ├── Cloud Memorystore Redis (ARQ queue)
       │
       └── GCS (PDF storage, signed URLs)

Cloud Run Worker (ARQ, --min-instances=1 --cpu-always-allocated)
 └── process_document job:
     ├── GCS download → PyMuPDF (PAGE markers, column detect, header strip)
     ├── Anthropic Files API upload (store file_id)
     ├── voyage-law-2 embed → pgvector insert (chunk_count updated AFTER)
     ├── Claude Opus 4.6 structured extraction (contract_type + party_perspective)
     └── Missing clause checklist → document-level risk flags
```

## Notes

- **Never run application locally** — all testing via GCP endpoints
- **pgvector** requires `cloudsql.enable_pgvector=on` flag on Cloud SQL instance
- **VPC connector** required for Cloud Run → Memorystore connectivity
- **GCS signed URLs** expire in 15 minutes — do not cache long-term
- **PAGE markers** in text are essential for accurate clause page attribution
- **chunk_count = null** indicates embedding never completed — treat as failed document
- **audit_logs** must be append-only at DB level (revoke UPDATE/DELETE from app role)
- **Agent SDK** `setting_sources=["project"]` loads from `.claude/skills/` in the container working directory — ensure Skills are copied into the image
