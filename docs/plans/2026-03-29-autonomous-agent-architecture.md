# ContractIQ v3 — Autonomous Agent Architecture

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the brittle 7-step extraction pipeline with a single autonomous ContractAgent that has full tool access (Read, Write, Glob, Grep, SemanticSearch) over workspace GCS files — mirroring how Claude Code works.

**Architecture:** PDF is converted to `contract.md` (GCS) + `locations.json` (bbox sidecar for PDF highlighting). The agent reads the full contract, applies workspace playbooks, writes `analysis.md`, and updates `portfolio.md`. For Q&A and portfolio search, the agent uses three search modes: exact grep, fuzzy (rapidfuzz), and semantic (pgvector). The `Clause` DB model is replaced by structured data inside `analysis.md`; pgvector chunks remain for semantic search only.

**Tech Stack:** FastAPI, SQLAlchemy async, ARQ, GCS, Anthropic Haiku API (direct tool_use), Voyage AI voyage-law-2, pgvector, rapidfuzz, PyMuPDF

---

## What gets DELETED in this plan

Before implementing, remove dead code:

- `backend/src/agents/clause_extraction_agent.py` — entire file
- `backend/src/agents/rag_agent.py` — entire file
- `backend/src/services/files_api.py` — entire file
- `backend/src/models/clause.py` — replaced by analysis.md
- `backend/src/api/clauses.py` — replaced by agent analysis endpoint
- `REQUIRED_CLAUSES` dict and `detect_contract_type()` in `document_worker.py`
- `anthropic_file_id` column in `Document` model (migration needed)
- `chunk_count`, `missing_clauses`, `summary` columns in `Document` (moved to analysis.md)
- `FilesAPIService` import everywhere

---

## GCS File Structure (workspace namespace)

```
workspaces/{workspace_id}/
  skills/
    playbook-nda.md
    playbook-saas_agreement.md
    playbook-employment.md
    playbook-msa.md
    playbook-sow.md
    playbook-ip_license.md
    playbook-generic.md
  memory/
    counterparties.md
    positions.md
  documents/
    {document_id}/
      contract.md          ← full contract text, page-marked
      locations.json       ← [{text, page, bbox}] for PDF highlighting
      analysis.md          ← agent's structured output (clauses, risks, summary)
  portfolio.md             ← running summary of all documents in workspace
```

---

## Default Playbook Template

Every workspace gets this seeded on creation for each contract type.

```markdown
# {Contract Type} Playbook

## Required Clauses
- List clause types that MUST be present (missing = HIGH risk minimum)

## Risk Calibration
- Specific conditions that elevate risk level
- e.g. "One-way NDA where we are disclosing = CRITICAL if no carve-outs"

## Red Flags
- Clause patterns that trigger CRITICAL/HIGH regardless of type
- e.g. "Residuals clause = CRITICAL"
- e.g. "Unlimited remedy = HIGH for vendor"

## Jurisdiction Notes
- Country/state specific concerns
- e.g. "France: RGPD compliance required if personal data mentioned"

## Negotiation Priorities
- What to push back on first
```

---

## analysis.md Format (written by agent)

```markdown
# Contract Analysis: {filename}

**Contract Type:** {type}
**Party Perspective:** {perspective}
**Counterparty:** {name if detected}
**Overall Risk:** CRITICAL | HIGH | MEDIUM | LOW
**Analyzed At:** {ISO timestamp}

## Summary
{2-3 sentence summary}

## Clauses

### {CLAUSE_TYPE} — {RISK_LEVEL}
**Page:** {n}
**Text:** "{excerpt}"
**Risk Reasoning:** {why this risk level}
**Jurisdiction Note:** {if applicable}

...

## Missing Clauses
- {CLAUSE_TYPE}: required by playbook, not found

## Negotiation Priorities
1. {item}
2. {item}

## Red Flags
- {description}

## Counterparty Notes
{any patterns observed about this counterparty}
```

---

## Task 1: Delete dead code

**Files:**
- Delete: `backend/src/agents/clause_extraction_agent.py`
- Delete: `backend/src/agents/rag_agent.py`
- Delete: `backend/src/services/files_api.py`
- Delete: `backend/src/models/clause.py`
- Delete: `backend/src/api/clauses.py`

**Step 1: Remove deleted files**

```bash
cd backend
rm src/agents/clause_extraction_agent.py
rm src/agents/rag_agent.py
rm src/services/files_api.py
rm src/models/clause.py
rm src/api/clauses.py
```

**Step 2: Remove imports from `src/models/__init__.py`**

Remove any `from .clause import ...` lines.

**Step 3: Remove imports from `src/main.py`**

Remove `clauses` from the import line:
```python
# Before
from src.api import auth, documents, clauses, conversations, workspaces
# After
from src.api import auth, documents, conversations, workspaces
```

Remove:
```python
app.include_router(clauses.router, prefix="/api/v2")
```

**Step 4: Remove from `src/api/conversations.py`**

Remove imports:
```python
from src.agents.rag_agent import RAGAgent
from src.agents.review_agent import ReviewAgent
```
(conversations.py will be replaced in Task 6)

**Step 5: Verify import errors**

```bash
cd backend
python -c "from src.main import app" 2>&1
```

Expected: No ImportError. Fix any remaining import references.

**Step 6: Commit**

```bash
git add -A
git commit -m "chore: remove dead pipeline code (clause extraction, RAG, files API)"
```

---

## Task 2: Clean Document model — remove unused columns + add region field

**Files:**
- Modify: `backend/src/models/document.py`
- Create: `backend/alembic/versions/002_document_cleanup.py`

**Step 1: Update Document model**

In `backend/src/models/document.py`, make these changes:

Remove these columns (they move to analysis.md):
```python
# REMOVE these lines:
anthropic_file_id: Mapped[str | None] = mapped_column(String, nullable=True)
chunk_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
missing_clauses: Mapped[list | None] = mapped_column(JSON, nullable=True)
summary: Mapped[str | None] = mapped_column(Text, nullable=True)
```

Remove the `clauses` relationship (model deleted):
```python
# REMOVE:
clauses: Mapped[list["Clause"]] = relationship(back_populates="document", cascade="all, delete-orphan")
```

Add `md_path` and `region` columns:
```python
md_path: Mapped[str | None] = mapped_column(String, nullable=True)
region: Mapped[str] = mapped_column(String, default="us")  # "us" | "eu" — controls GCS bucket routing
```

**Step 2: Create migration**

```bash
cd backend
alembic revision --autogenerate -m "document_cleanup"
```

Then open the generated file and verify it drops the right columns and adds `md_path`. Edit if autogenerate misses anything:

```python
def upgrade() -> None:
    op.drop_column("documents", "anthropic_file_id")
    op.drop_column("documents", "chunk_count")
    op.drop_column("documents", "missing_clauses")
    op.drop_column("documents", "summary")
    op.add_column("documents", sa.Column("md_path", sa.String(), nullable=True))
    op.add_column("workspaces", sa.Column("region", sa.String(), nullable=False, server_default="us"))
    op.drop_table("clauses")

def downgrade() -> None:
    # reverse if needed
    pass
```

**Step 3: Run migration locally**

```bash
alembic upgrade head
```

Expected: Migration completes without error.

**Step 4: Commit**

```bash
git add backend/src/models/document.py backend/alembic/versions/
git commit -m "feat: clean document model, drop clause table, add md_path + region"
```

---

## Task 3: GCS service — add text read/write methods + region routing + CMEK

**Files:**
- Modify: `backend/src/services/gcs_service.py`
- Modify: `backend/src/core/config.py` — add `gcs_bucket_eu`, `gcs_kms_key_us`, `gcs_kms_key_eu` settings

**Step 1: Add settings**

In `config.py`, add to the `Settings` class:
```python
gcs_bucket_eu: str = ""           # e.g. "contractiq-eu" — leave empty if not needed yet
gcs_kms_key_us: str = ""          # KMS key resource name for US bucket (optional)
gcs_kms_key_eu: str = ""          # KMS key resource name for EU bucket (optional)
```

**Step 2: Update GCSService**

Replace the `__init__` and add region routing + CMEK support. Add all methods below:

```python
async def read_text(self, gcs_path: str) -> str | None:
    """Returns UTF-8 text content of a GCS object, or None if not found."""
    blob = self.bucket.blob(gcs_path)
    try:
        data = await asyncio.to_thread(blob.download_as_bytes)
        return data.decode("utf-8")
    except NotFound:
        return None

async def write_text(self, gcs_path: str, content: str, content_type: str = "text/markdown", region: str = "us") -> None:
    """Uploads a UTF-8 string to GCS, using region-appropriate bucket + optional CMEK."""
    blob = self._blob(gcs_path, region)
    await asyncio.to_thread(blob.upload_from_string, content.encode("utf-8"), content_type=content_type)

async def read_text(self, gcs_path: str, region: str = "us") -> str | None:
    """Returns UTF-8 text content, or None if not found."""
    blob = self._blob(gcs_path, region)
    try:
        data = await asyncio.to_thread(blob.download_as_bytes)
        return data.decode("utf-8")
    except NotFound:
        return None

async def list_blobs(self, prefix: str, region: str = "us") -> list[str]:
    """Returns list of GCS paths matching prefix."""
    bucket = self.bucket_for_region(region)
    blobs = await asyncio.to_thread(
        lambda: list(self.client.list_blobs(bucket.name, prefix=prefix))
    )
    return [b.name for b in blobs]

async def upload_file(self, local_path: str, gcs_path: str, content_type: str = "application/pdf", region: str = "us") -> str:
    blob = self._blob(gcs_path, region)
    await asyncio.to_thread(blob.upload_from_filename, local_path, content_type=content_type)
    return gcs_path

def get_signed_url(self, gcs_path: str, expiration_minutes: int = 15, region: str = "us") -> str:
    blob = self._blob(gcs_path, region)
    return blob.generate_signed_url(expiration=timedelta(minutes=expiration_minutes))

async def delete_file(self, gcs_path: str, region: str = "us") -> None:
    blob = self._blob(gcs_path, region)
    try:
        await asyncio.to_thread(blob.delete)
    except NotFound:
        pass
```

**Step 3: Verify**

```bash
cd backend
python -c "from src.services.gcs_service import GCSService; print('ok')"
```

**Step 4: Commit**

```bash
git add backend/src/services/gcs_service.py backend/src/core/config.py
git commit -m "feat: GCS region routing, CMEK support, read_text/write_text/list_blobs"
```

---

## Task 4: Update document_processor.py — output contract.md + locations.json

**Files:**
- Modify: `backend/src/services/document_processor.py`

**Step 1: Change ProcessedDocument dataclass**

Replace the current dataclass with:

```python
@dataclass(frozen=True)
class LocationEntry:
    text: str
    page: int
    bbox: tuple

@dataclass(frozen=True)
class ProcessedDocument:
    contract_md: str          # full contract as markdown with page markers
    locations: list[LocationEntry]   # for PDF highlighting
    page_count: int
    metadata: dict
    truncated: bool = False
```

**Step 2: Update `process_pdf` to return new format**

After the existing text extraction loop (keep the same PyMuPDF logic), replace the return:

```python
# Build contract.md
contract_md = "\n".join(full_text_parts)

# Build locations list (all blocks, no dedup needed — used for frontend highlighting)
locations = [
    LocationEntry(
        text=" ".join(
            span["text"]
            for line in block.get("lines", [])
            for span in line.get("spans", [])
        ).strip(),
        page=page_num,
        bbox=tuple(block["bbox"]),
    )
    for page_num, page in enumerate(fitz.open(file_path), start=1)  # NOTE: re-open handled below
    for block in page.get_text("dict")["blocks"]
    if block["type"] == 0
]
```

Actually, build `locations` inside the existing loop to avoid re-opening the file. Add inside the block loop:

```python
locations.append(LocationEntry(
    text=text,
    page=page_num,
    bbox=tuple(block["bbox"]),
))
```

Declare `locations: list[LocationEntry] = []` at top of method.

Update return:
```python
return ProcessedDocument(
    contract_md=full_text[:self.MAX_CHARS] if len(full_text) > self.MAX_CHARS else full_text,
    locations=locations,
    page_count=len(doc),
    metadata={
        "title": doc.metadata.get("title", ""),
        "author": doc.metadata.get("author", ""),
    },
    truncated=len(full_text) > self.MAX_CHARS,
)
```

**Step 3: Verify**

```bash
cd backend
python -c "
from src.services.document_processor import DocumentProcessor
# Just verify import and class instantiation
d = DocumentProcessor()
print('ok')
"
```

**Step 4: Commit**

```bash
git add backend/src/services/document_processor.py
git commit -m "feat: document processor outputs contract.md + locations.json"
```

---

## Task 5: Seed default playbooks on workspace creation

**Files:**
- Create: `backend/src/services/playbook_service.py`
- Modify: `backend/src/api/workspaces.py`

**Step 1: Create playbook_service.py**

```python
import json
from src.services.gcs_service import GCSService

CONTRACT_TYPES = ["nda", "saas_agreement", "employment", "msa", "sow", "ip_license", "generic"]

DEFAULT_PLAYBOOKS: dict[str, str] = {
    "nda": """# NDA Playbook

## Required Clauses
- CONFIDENTIALITY, TERMINATION, GOVERNING_LAW, DISPUTE_RESOLUTION

## Risk Calibration
- One-way NDA where we are the disclosing party = CRITICAL if no carve-outs for prior knowledge
- Survival period > 3 years post-termination = HIGH
- Mutual NDA = LOW base risk for confidentiality

## Red Flags
- No definition of "Confidential Information" = CRITICAL
- Residuals clause (retaining knowledge in unaided memory) = CRITICAL
- Unlimited remedy / injunctive relief without reciprocity = HIGH

## Jurisdiction Notes
- UK: implied duty of confidence exists even without a contract
- France: RGPD compliance required if personal data is in scope
- US/CA: trade secret protections under DTSA may supplement

## Negotiation Priorities
1. Narrow the definition of Confidential Information
2. Add carve-outs: public domain, independent development, prior knowledge
3. Cap survival period to 2 years
4. Remove or reciprocate residuals clause
5. Add mutual injunctive relief or remove it entirely
""",
    "saas_agreement": """# SaaS Agreement Playbook

## Required Clauses
- PAYMENT, LIABILITY, CONFIDENTIALITY, DATA_PROCESSING, TERMINATION, IP_OWNERSHIP

## Risk Calibration
- No liability cap = CRITICAL for vendor
- Auto-renewal without notice period = HIGH for customer
- Data processing terms absent when PII involved = CRITICAL

## Red Flags
- Unlimited indemnification scope = CRITICAL
- Vendor can modify terms unilaterally = HIGH
- No SLA or uptime guarantee = MEDIUM

## Jurisdiction Notes
- EU customers: GDPR DPA required, SCCs if data leaves EU
- US: CCPA compliance for California customers

## Negotiation Priorities
1. Cap liability at 12 months of fees paid
2. Add 30-day notice before auto-renewal
3. Negotiate DPA with appropriate SCCs
4. Define acceptable use policy scope
5. Add data portability and deletion rights on termination
""",
    "employment": """# Employment Agreement Playbook

## Required Clauses
- PAYMENT, NON_COMPETE, CONFIDENTIALITY, TERMINATION, GOVERNING_LAW

## Risk Calibration
- Non-compete scope > 1 year or > regional = HIGH for employee
- IP assignment clause covering pre-employment inventions = CRITICAL for employee
- At-will termination with no severance = HIGH

## Red Flags
- Blanket IP assignment with no carve-out for personal projects = CRITICAL
- Non-solicitation covering customers AND employees with no time limit = HIGH
- Arbitration clause waiving class action = HIGH

## Jurisdiction Notes
- California: non-competes generally unenforceable
- UK: non-competes enforceable if reasonable in scope and duration

## Negotiation Priorities
1. Carve out pre-employment inventions from IP assignment
2. Limit non-compete to 6 months, direct competitors only
3. Add severance provision (minimum 1 month per year of service)
4. Define termination for cause narrowly
5. Remove class action waiver
""",
    "msa": """# Master Services Agreement Playbook

## Required Clauses
- PAYMENT, LIABILITY, INDEMNIFICATION, CONFIDENTIALITY, TERMINATION, GOVERNING_LAW

## Risk Calibration
- No mutual indemnification = HIGH for service provider
- Payment terms > Net 60 = HIGH for service provider
- Uncapped indemnification for IP infringement = CRITICAL

## Red Flags
- Step-in rights allowing customer to replace personnel = HIGH
- Benchmarking rights without clear process = MEDIUM
- Change order process absent = HIGH

## Negotiation Priorities
1. Cap total liability at 12 months of fees
2. Mutual IP indemnification
3. Net 30 payment terms
4. Define change order process explicitly
5. Limit audit rights to once per year with 30 days notice
""",
    "sow": """# Statement of Work Playbook

## Required Clauses
- PAYMENT, ACCEPTANCE_CRITERIA, IP_OWNERSHIP, CHANGE_ORDER, TERMINATION

## Risk Calibration
- Acceptance criteria undefined or purely subjective = CRITICAL
- IP ownership silent (defaults to work-for-hire) = HIGH for contractor
- No change order process = HIGH

## Red Flags
- Unlimited revisions without change order = HIGH
- Penalty clauses for delay without force majeure = HIGH
- Payment tied solely to final acceptance = HIGH

## Negotiation Priorities
1. Define acceptance criteria with objective pass/fail tests
2. Explicit IP ownership (license vs. assignment)
3. Change order triggers and pricing mechanism
4. Milestone-based payment schedule
5. Force majeure clause covering delays
""",
    "ip_license": """# IP License Playbook

## Required Clauses
- IP_OWNERSHIP, PAYMENT, TERMINATION, GOVERNING_LAW

## Risk Calibration
- Exclusive license with no minimum royalty = HIGH for licensor
- Sublicensing rights without approval = HIGH for licensor
- No audit rights on royalty reporting = HIGH

## Red Flags
- Assignment of improvements to licensee = CRITICAL for licensor
- Termination for convenience without royalty tail = HIGH
- No representation on non-infringement = HIGH for licensee

## Negotiation Priorities
1. Define licensed field of use narrowly
2. Minimum annual royalties or reversion clause
3. Audit rights on royalty statements
4. Improvement ownership stays with licensor
5. Termination for cause only (not convenience)
""",
    "generic": """# Generic Contract Playbook

## Required Clauses
- TERMINATION, GOVERNING_LAW

## Risk Calibration
- No limitation of liability = HIGH
- Automatic renewal without notice = MEDIUM

## Red Flags
- One-sided amendment rights = HIGH
- Entire agreement clause missing = MEDIUM

## Negotiation Priorities
1. Add liability cap
2. Define termination triggers clearly
3. Require mutual written amendment process
""",
}


async def seed_workspace_playbooks(workspace_id: str) -> None:
    """Write default playbooks to GCS for a new workspace."""
    gcs = GCSService()
    for contract_type, content in DEFAULT_PLAYBOOKS.items():
        path = f"workspaces/{workspace_id}/skills/playbook-{contract_type}.md"
        await gcs.write_text(path, content)

    # Seed empty memory files
    await gcs.write_text(
        f"workspaces/{workspace_id}/memory/counterparties.md",
        "# Counterparty Memory\n\nNo counterparties analyzed yet.\n"
    )
    await gcs.write_text(
        f"workspaces/{workspace_id}/memory/positions.md",
        "# Our Positions\n\nAdd your company's standard negotiation positions here.\n"
    )
    await gcs.write_text(
        f"workspaces/{workspace_id}/portfolio.md",
        "# Portfolio\n\nNo documents analyzed yet.\n"
    )
```

**Step 2: Call seed on workspace creation in `workspaces.py`**

Find the `POST /workspaces` endpoint and add after `db.commit()`:

```python
from src.services.playbook_service import seed_workspace_playbooks
await seed_workspace_playbooks(workspace_id)
```

**Step 3: Verify import**

```bash
cd backend
python -c "from src.services.playbook_service import seed_workspace_playbooks; print('ok')"
```

**Step 4: Commit**

```bash
git add backend/src/services/playbook_service.py backend/src/api/workspaces.py
git commit -m "feat: seed default playbooks and memory files on workspace creation"
```

---

## Task 6: Workspace tools for the agent (WorkspaceToolkit) + Agent Audit Log

**Files:**
- Create: `backend/src/services/workspace_tools.py`
- Create: `backend/src/models/agent_audit_log.py`
- Modify: `backend/src/models/__init__.py` — add AgentAuditLog import
- Add migration entry to Task 13

**Step 0: Create AgentAuditLog model**

Create `backend/src/models/agent_audit_log.py`:

```python
import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Integer, func
from sqlalchemy.orm import Mapped, mapped_column
from src.core.database import Base


class AgentAuditLog(Base):
    """Records every file tool call the agent makes — for GDPR data access audit trail."""
    __tablename__ = "agent_audit_logs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    document_id: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    tool: Mapped[str] = mapped_column(String, nullable=False)          # workspace_read, workspace_write, etc.
    input_summary: Mapped[str | None] = mapped_column(String, nullable=True)  # first 500 chars of input JSON
    result_chars: Mapped[int | None] = mapped_column(Integer, nullable=True)  # size of result returned
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
```

Add to migration in Task 13:
```python
op.create_table(
    "agent_audit_logs",
    sa.Column("id", sa.String(), primary_key=True),
    sa.Column("workspace_id", sa.String(), nullable=False, index=True),
    sa.Column("document_id", sa.String(), nullable=True),
    sa.Column("tool", sa.String(), nullable=False),
    sa.Column("input_summary", sa.String(), nullable=True),
    sa.Column("result_chars", sa.Integer(), nullable=True),
    sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
)
```

This is the agent's filesystem. Four tools: Read, Write, Glob, Grep (exact + fuzzy), plus SemanticSearch (pgvector).

**Step 1: Create workspace_tools.py**

```python
import re
import json
import asyncio
from dataclasses import dataclass
from rapidfuzz import process as fuzz_process, fuzz
from src.services.gcs_service import GCSService
from src.services.vector_store import VectorStore
from sqlalchemy.ext.asyncio import AsyncSession


@dataclass
class GrepMatch:
    path: str
    line_number: int
    line: str
    score: float = 1.0  # 1.0 for exact, 0-1 for fuzzy


@dataclass
class SearchResult:
    document_id: str
    page_number: int | None
    text: str
    similarity: float


class WorkspaceToolkit:
    """
    Agent's file tools, scoped to a workspace.
    All paths are relative to workspaces/{workspace_id}/.
    """

    def __init__(self, workspace_id: str, db: AsyncSession):
        self.workspace_id = workspace_id
        self.db = db
        self._gcs = GCSService()
        self._vector_store = VectorStore()

    def _full_path(self, relative_path: str) -> str:
        """Resolve relative path to full GCS path, enforce workspace scope."""
        # Strip leading slash or workspace prefix if agent accidentally includes it
        relative_path = relative_path.lstrip("/")
        if relative_path.startswith(f"workspaces/{self.workspace_id}/"):
            return relative_path
        return f"workspaces/{self.workspace_id}/{relative_path}"

    async def read(self, path: str) -> str | None:
        """Read a file. Returns None if not found."""
        return await self._gcs.read_text(self._full_path(path))

    async def write(self, path: str, content: str) -> None:
        """Write/overwrite a file."""
        await self._gcs.write_text(self._full_path(path), content)

    async def glob(self, pattern: str) -> list[str]:
        """
        List files matching a glob-style pattern within the workspace.
        Supports * (any chars except /) and ** (any chars including /).
        Returns relative paths (stripped of workspace prefix).
        """
        prefix = f"workspaces/{self.workspace_id}/"
        all_paths = await self._gcs.list_blobs(prefix)

        # Convert glob pattern to regex
        pattern_full = prefix + pattern.lstrip("/")
        regex = re.escape(pattern_full).replace(r"\*\*", ".*").replace(r"\*", "[^/]*")
        compiled = re.compile(f"^{regex}$")

        matched = [p[len(prefix):] for p in all_paths if compiled.match(p)]
        return matched

    async def grep(
        self,
        query: str,
        path_pattern: str = "**/*.md",
        mode: str = "exact",       # "exact" | "regex" | "fuzzy"
        fuzzy_threshold: int = 70,
        max_results: int = 20,
    ) -> list[GrepMatch]:
        """
        Search file contents across workspace.
        mode="exact"  → substring match (case-insensitive)
        mode="regex"  → full regex match per line
        mode="fuzzy"  → rapidfuzz partial_ratio per line, score >= fuzzy_threshold
        """
        paths = await self.glob(path_pattern)
        results: list[GrepMatch] = []

        for path in paths:
            content = await self.read(path)
            if not content:
                continue
            lines = content.splitlines()

            for i, line in enumerate(lines, start=1):
                if mode == "exact":
                    if query.lower() in line.lower():
                        results.append(GrepMatch(path=path, line_number=i, line=line.strip()))
                elif mode == "regex":
                    if re.search(query, line, re.IGNORECASE):
                        results.append(GrepMatch(path=path, line_number=i, line=line.strip()))
                elif mode == "fuzzy":
                    score = fuzz.partial_ratio(query.lower(), line.lower())
                    if score >= fuzzy_threshold:
                        results.append(GrepMatch(path=path, line_number=i, line=line.strip(), score=score / 100))

        # Sort fuzzy by score descending, others by path+line
        if mode == "fuzzy":
            results.sort(key=lambda r: r.score, reverse=True)

        return results[:max_results]

    async def semantic_search(
        self,
        query: str,
        document_id: str | None = None,
        n_results: int = 10,
    ) -> list[SearchResult]:
        """Semantic vector search over pgvector chunks."""
        chunks = await self._vector_store.query(
            db=self.db,
            workspace_id=self.workspace_id,
            query_text=query,
            n_results=n_results,
            document_id=document_id,
        )
        return [
            SearchResult(
                document_id=c["document_id"],
                page_number=c.get("page_number"),
                text=c["text"],
                similarity=c["similarity"],
            )
            for c in chunks
        ]

    def to_tool_definitions(self) -> list[dict]:
        """
        Returns Anthropic tool_use definitions for all workspace tools.
        Pass these to the messages.create() call.
        """
        return [
            {
                "name": "workspace_read",
                "description": "Read a file from the workspace. Path is relative to the workspace root (e.g. 'documents/{id}/contract.md', 'skills/playbook-nda.md', 'memory/counterparties.md').",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "path": {"type": "string", "description": "Relative path within workspace"}
                    },
                    "required": ["path"],
                    "additionalProperties": False,
                }
            },
            {
                "name": "workspace_write",
                "description": "Write or overwrite a file in the workspace. Use this to save analysis.md, update portfolio.md, update memory files.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "path": {"type": "string"},
                        "content": {"type": "string", "description": "Full file content (not append — full overwrite)"}
                    },
                    "required": ["path", "content"],
                    "additionalProperties": False,
                }
            },
            {
                "name": "workspace_glob",
                "description": "List files in the workspace matching a glob pattern. Use ** for recursive. E.g. 'documents/*/analysis.md' lists all analysis files.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "pattern": {"type": "string", "description": "Glob pattern, e.g. 'documents/*/contract.md'"}
                    },
                    "required": ["pattern"],
                    "additionalProperties": False,
                }
            },
            {
                "name": "workspace_grep",
                "description": "Search file contents across the workspace. Use mode='exact' for substring, mode='regex' for patterns, mode='fuzzy' for approximate matching (handles paraphrasing, e.g. 'liability cap' matches 'damages limited to').",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string"},
                        "path_pattern": {"type": "string", "default": "**/*.md", "description": "Glob pattern to limit search scope"},
                        "mode": {"type": "string", "enum": ["exact", "regex", "fuzzy"], "default": "exact"},
                        "fuzzy_threshold": {"type": "integer", "default": 70, "description": "Minimum score 0-100 for fuzzy mode"},
                        "max_results": {"type": "integer", "default": 20}
                    },
                    "required": ["query"],
                    "additionalProperties": False,
                }
            },
            {
                "name": "workspace_semantic_search",
                "description": "Semantic vector search over contract text using embeddings. Best for meaning-based queries like 'clauses that shift risk to vendor' or 'data breach notification obligations'. Use when exact/fuzzy grep isn't finding what you need.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string"},
                        "document_id": {"type": "string", "description": "Limit to a specific document (optional)"},
                        "n_results": {"type": "integer", "default": 10}
                    },
                    "required": ["query"],
                    "additionalProperties": False,
                }
            },
        ]

    async def dispatch_tool(self, tool_name: str, tool_input: dict) -> str:
        """Execute a tool call from the agent, log it, and return result as string."""
        result = await self._dispatch(tool_name, tool_input)

        # Audit log — record every file access for GDPR data access trail
        try:
            from src.models.agent_audit_log import AgentAuditLog
            import json as _json
            # Extract document_id from path if present
            path = tool_input.get("path", "")
            doc_id = None
            if "/documents/" in path:
                parts = path.split("/documents/")
                if len(parts) > 1:
                    doc_id = parts[1].split("/")[0]
            log = AgentAuditLog(
                workspace_id=self.workspace_id,
                document_id=doc_id,
                tool=tool_name,
                input_summary=_json.dumps(tool_input)[:500],
                result_chars=len(result),
            )
            self.db.add(log)
            await self.db.flush()
        except Exception:
            pass  # never block agent execution over audit logging

        return result

    async def _dispatch(self, tool_name: str, tool_input: dict) -> str:
        """Internal dispatch — separated so audit wrapping is clean."""
        if tool_name == "workspace_read":
            content = await self.read(tool_input["path"])
            return content if content is not None else f"File not found: {tool_input['path']}"

        elif tool_name == "workspace_write":
            await self.write(tool_input["path"], tool_input["content"])
            return f"Written: {tool_input['path']}"

        elif tool_name == "workspace_glob":
            paths = await self.glob(tool_input["pattern"])
            return json.dumps(paths) if paths else "No files matched"

        elif tool_name == "workspace_grep":
            matches = await self.grep(
                query=tool_input["query"],
                path_pattern=tool_input.get("path_pattern", "**/*.md"),
                mode=tool_input.get("mode", "exact"),
                fuzzy_threshold=tool_input.get("fuzzy_threshold", 70),
                max_results=tool_input.get("max_results", 20),
            )
            if not matches:
                return "No matches found"
            return "\n".join(
                f"{m.path}:{m.line_number}: {m.line}" + (f" (score={m.score:.2f})" if m.score < 1.0 else "")
                for m in matches
            )

        elif tool_name == "workspace_semantic_search":
            results = await self.semantic_search(
                query=tool_input["query"],
                document_id=tool_input.get("document_id"),
                n_results=tool_input.get("n_results", 10),
            )
            if not results:
                return "No results found"
            return "\n\n".join(
                f"[doc:{r.document_id} page:{r.page_number} sim:{r.similarity:.2f}]\n{r.text}"
                for r in results
            )

        return f"Unknown tool: {tool_name}"
    # end _dispatch
```

**Step 2: Add rapidfuzz to dependencies**

In `backend/pyproject.toml`, add to dependencies:
```toml
"rapidfuzz>=3.0",
```

**Step 3: Verify**

```bash
cd backend
pip install rapidfuzz
python -c "from src.services.workspace_tools import WorkspaceToolkit; print('ok')"
```

**Step 4: Commit**

```bash
git add backend/src/services/workspace_tools.py backend/pyproject.toml
git commit -m "feat: WorkspaceToolkit with Read/Write/Glob/Grep/SemanticSearch tools"
```

---

## Task 7: ContractAgent — autonomous agent with tool loop

**Files:**
- Create: `backend/src/agents/contract_agent.py`

This replaces `ClauseExtractionAgent`, `RAGAgent`, and `ReviewAgent`. One agent, all tasks.

**Step 1: Create contract_agent.py**

```python
import json
import logging
from collections.abc import AsyncGenerator
import anthropic
from src.core.config import get_settings
from src.services.workspace_tools import WorkspaceToolkit

logger = logging.getLogger(__name__)

MODEL = "claude-haiku-4-5-20251001"
MAX_TOKENS = 8192
MAX_TOOL_ROUNDS = 20  # prevent infinite loops


ANALYZE_SYSTEM = """You are a senior commercial attorney analyzing contracts.

You have tools to read and write files in a workspace:
- workspace_read: read contract.md, playbooks, memory files
- workspace_write: write analysis.md and update portfolio.md and memory files
- workspace_glob: list files
- workspace_grep: search with exact, regex, or fuzzy matching
- workspace_semantic_search: meaning-based search over contract chunks

## Your analysis workflow for a new document:
1. Read the contract: workspace_read("documents/{document_id}/contract.md")
2. Read the relevant playbook: workspace_read("skills/playbook-{contract_type}.md")
3. Read counterparty memory: workspace_read("memory/counterparties.md")
4. Analyze the contract thoroughly against the playbook
5. Write structured analysis: workspace_write("documents/{document_id}/analysis.md", ...)
6. Update portfolio: read portfolio.md, append this document's summary, write it back
7. Update counterparty memory if new information found

## analysis.md format you MUST follow:
```
# Contract Analysis: {filename}

**Contract Type:** {type}
**Party Perspective:** {perspective}
**Counterparty:** {name or "Unknown"}
**Overall Risk:** CRITICAL|HIGH|MEDIUM|LOW
**Analyzed At:** {ISO timestamp}

## Summary
{2-3 sentences}

## Clauses

### {CLAUSE_TYPE} — {RISK_LEVEL}
**Page:** {n}
**Text:** "{exact quote from contract}"
**Risk Reasoning:** {why}
**Jurisdiction Note:** {if applicable, else omit}

## Missing Clauses
- {TYPE}: required by playbook, not found in contract

## Negotiation Priorities
1. {item}

## Red Flags
- {description}

## Counterparty Notes
{patterns observed}
```

Be thorough. Quote exact text. Reference page numbers. Apply playbook rules explicitly."""


QA_SYSTEM = """You are a contract analysis assistant.

You have tools to search and read contract files:
- workspace_read: read contract.md or analysis.md for a specific document
- workspace_grep: search across all documents (exact, regex, fuzzy)
- workspace_semantic_search: meaning-based search

Answer the user's question using the contract content. Always cite page numbers.
If the question is about a specific document, read that document's contract.md and analysis.md first.
If the question spans the entire portfolio, use grep or semantic_search across all documents."""


class ContractAgent:
    def __init__(self):
        settings = get_settings()
        self._client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    async def _run_tool_loop(
        self,
        system: str,
        initial_messages: list[dict],
        toolkit: WorkspaceToolkit,
    ) -> AsyncGenerator[str, None]:
        """
        Agentic tool loop: Haiku calls tools, we execute them, feed results back.
        Streams text chunks as SSE events.
        Yields strings in SSE format: data: {"type": "text"|"done"|"error", ...}
        """
        messages = list(initial_messages)
        tools = toolkit.to_tool_definitions()

        for round_num in range(MAX_TOOL_ROUNDS):
            response = await self._client.messages.create(
                model=MODEL,
                max_tokens=MAX_TOKENS,
                system=system,
                tools=tools,
                messages=messages,
            )

            # Stream any text blocks to client
            for block in response.content:
                if block.type == "text" and block.text:
                    yield f"data: {json.dumps({'type': 'text', 'text': block.text})}\n\n"

            # Stop if no tool use
            if response.stop_reason == "end_turn":
                break

            if response.stop_reason != "tool_use":
                logger.warning(f"Unexpected stop_reason: {response.stop_reason}")
                break

            # Execute all tool calls
            tool_results = []
            for block in response.content:
                if block.type == "tool_use":
                    logger.info(f"Tool call: {block.name}({json.dumps(block.input)[:200]})")
                    result = await toolkit.dispatch_tool(block.name, block.input)
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": result,
                    })

            # Append assistant turn + tool results to messages
            messages.append({"role": "assistant", "content": response.content})
            messages.append({"role": "user", "content": tool_results})

        else:
            yield f"data: {json.dumps({'type': 'error', 'message': 'Max tool rounds reached'})}\n\n"

        yield 'data: {"type": "done"}\n\n'

    async def analyze_document(
        self,
        toolkit: WorkspaceToolkit,
        document_id: str,
        filename: str,
        contract_type: str,
        party_perspective: str,
    ) -> AsyncGenerator[str, None]:
        """Full autonomous document analysis. Writes analysis.md + updates portfolio."""
        prompt = (
            f"Analyze the contract '{filename}' (document_id: {document_id}).\n"
            f"Contract type: {contract_type}, party perspective: {party_perspective}.\n\n"
            f"Follow your analysis workflow: read contract.md, read the playbook, "
            f"read counterparty memory, write analysis.md, update portfolio.md."
        )
        async for chunk in self._run_tool_loop(
            system=ANALYZE_SYSTEM,
            initial_messages=[{"role": "user", "content": prompt}],
            toolkit=toolkit,
        ):
            yield chunk

    async def ask(
        self,
        toolkit: WorkspaceToolkit,
        question: str,
        document_id: str | None = None,
    ) -> AsyncGenerator[str, None]:
        """Q&A over workspace contracts. Streams SSE."""
        context = f"Document ID in scope: {document_id}" if document_id else "Search across all workspace documents."
        prompt = f"{context}\n\nQuestion: {question}"
        async for chunk in self._run_tool_loop(
            system=QA_SYSTEM,
            initial_messages=[{"role": "user", "content": prompt}],
            toolkit=toolkit,
        ):
            yield chunk
```

**Step 2: Verify**

```bash
cd backend
python -c "from src.agents.contract_agent import ContractAgent; print('ok')"
```

**Step 3: Commit**

```bash
git add backend/src/agents/contract_agent.py
git commit -m "feat: ContractAgent with autonomous tool loop (Read/Write/Glob/Grep/Semantic)"
```

---

## Task 7b: PII Redaction service

**Files:**
- Create: `backend/src/services/pii_redactor.py`

Add `presidio-analyzer` and `presidio-anonymizer` to `pyproject.toml` dependencies:
```toml
"presidio-analyzer>=2.2",
"presidio-anonymizer>=2.2",
"spacy>=3.0",
```

Also run after install: `python -m spacy download en_core_web_lg`

**Step 1: Create pii_redactor.py**

```python
import logging
from functools import lru_cache

logger = logging.getLogger(__name__)

# Lazy import — presidio is large, only load when needed
_analyzer = None
_anonymizer = None


def _get_engines():
    global _analyzer, _anonymizer
    if _analyzer is None:
        from presidio_analyzer import AnalyzerEngine
        from presidio_anonymizer import AnonymizerEngine
        _analyzer = AnalyzerEngine()
        _anonymizer = AnonymizerEngine()
    return _analyzer, _anonymizer


# Entity types to redact before sending to LLM
REDACT_ENTITIES = [
    "PERSON", "EMAIL_ADDRESS", "PHONE_NUMBER",
    "US_SSN", "CREDIT_CARD", "IBAN_CODE",
    "IP_ADDRESS", "URL",
]


def redact_pii(text: str) -> str:
    """
    Replace PII with labeled placeholders before sending to external LLM APIs.
    e.g. "John Smith" → "<PERSON>", "john@corp.com" → "<EMAIL_ADDRESS>"
    Contract party names (e.g. "Acme Corp") are NOT redacted — they are org names, not personal data.
    The raw PDF is never modified — only the in-memory text sent to Anthropic/Voyage.
    """
    try:
        analyzer, anonymizer = _get_engines()
        results = analyzer.analyze(
            text=text,
            entities=REDACT_ENTITIES,
            language="en",
        )
        if not results:
            return text
        return anonymizer.anonymize(text=text, analyzer_results=results).text
    except Exception as e:
        # Never block processing over redaction failure — log and continue
        logger.warning(f"PII redaction failed, sending unredacted text: {e}")
        return text
```

**Step 2: Verify**

```bash
cd backend
python -c "from src.services.pii_redactor import redact_pii; print(redact_pii('Call John at 555-123-4567'))"
```

Expected: `Call <PERSON> at <PHONE_NUMBER>`

**Step 3: Commit**

```bash
git add backend/src/services/pii_redactor.py backend/pyproject.toml
git commit -m "feat: PII redaction service using presidio (redacts before LLM calls)"
```

---

## Task 8: Rewrite document_worker.py

**Files:**
- Modify: `backend/src/workers/document_worker.py`

**Step 1: Replace the entire file**

```python
import asyncio
import json
import logging
import tempfile
import os
from arq.connections import RedisSettings
from sqlalchemy import select

from src.core.config import get_settings
from src.core.database import AsyncSessionLocal
from src.models.document import Document, DocumentStatus, ContractType
from src.services.gcs_service import GCSService
from src.services.document_processor import DocumentProcessor
from src.services.vector_store import VectorStore
from src.services.pii_redactor import redact_pii
from src.agents.contract_agent import ContractAgent
from src.services.workspace_tools import WorkspaceToolkit

logger = logging.getLogger(__name__)


async def process_document(ctx: dict, document_id: str) -> None:
    """ARQ job: PDF → contract.md + locations.json + embeddings + agent analysis."""
    gcs = GCSService()
    processor = DocumentProcessor()
    vector_store = VectorStore()
    agent = ContractAgent()

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Document).where(Document.id == document_id))
        document = result.scalar_one_or_none()
        if not document:
            logger.error(f"Document {document_id} not found")
            return

        document.status = DocumentStatus.PROCESSING
        await db.commit()

        tmp_path = None
        try:
            # Step 1: Download PDF from GCS
            with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
                tmp_path = tmp.name
            blob = gcs.bucket.blob(document.gcs_path)
            await asyncio.to_thread(blob.download_to_filename, tmp_path)

            # Step 2: PyMuPDF → contract.md + locations
            processed = processor.process_pdf(tmp_path)
            document.page_count = processed.page_count
            document.truncated = processed.truncated

            # Step 3: Redact PII, then save contract.md to GCS
            # Raw PDF stays unredacted in GCS. Only the MD (sent to LLM) is redacted.
            redacted_md = redact_pii(processed.contract_md)
            md_path = f"workspaces/{document.workspace_id}/documents/{document_id}/contract.md"
            region = getattr(document, "region", "us")
            await gcs.write_text(md_path, redacted_md, region=region)
            document.md_path = md_path

            # Step 4: Save locations.json to GCS (for PDF highlighting)
            locations_data = [
                {"text": loc.text, "page": loc.page, "bbox": list(loc.bbox)}
                for loc in processed.locations
            ]
            locations_path = f"workspaces/{document.workspace_id}/documents/{document_id}/locations.json"
            await gcs.write_text(locations_path, json.dumps(locations_data), content_type="application/json")  # NOTE: write_text needs content_type param — add it

            # Step 5: Embed chunks → pgvector (for semantic search)
            chunks = [
                {
                    "text": loc.text,
                    "page_number": loc.page,
                    "chunk_index": i,
                    "metadata": {"bbox": list(loc.bbox)},
                }
                for i, loc in enumerate(processed.locations)
                if len(loc.text) >= 30  # skip very short fragments
            ]
            await vector_store.add_chunks(
                db=db,
                document_id=document_id,
                workspace_id=document.workspace_id,
                chunks=chunks,
            )
            await db.commit()

            # Step 6: Run autonomous agent analysis
            toolkit = WorkspaceToolkit(workspace_id=document.workspace_id, db=db)
            async for _ in agent.analyze_document(
                toolkit=toolkit,
                document_id=document_id,
                filename=document.filename,
                contract_type=document.contract_type.value,
                party_perspective=document.party_perspective.value,
            ):
                pass  # worker doesn't stream; agent writes analysis.md directly

            # Step 7: Mark READY
            document.status = DocumentStatus.READY
            await db.commit()

            logger.info(f"Document {document_id} processed: {processed.page_count} pages, {len(chunks)} chunks")

        except Exception as e:
            logger.error(f"Document {document_id} failed: {e}", exc_info=True)
            document.status = DocumentStatus.FAILED
            document.error_message = str(e)[:500]
            await db.commit()
        finally:
            if tmp_path and os.path.exists(tmp_path):
                os.unlink(tmp_path)


class WorkerSettings:
    functions = [process_document]
    redis_settings = RedisSettings.from_dsn(os.getenv("REDIS_URL", "redis://localhost:6379"))

    @staticmethod
    async def on_startup(ctx: dict):
        get_settings()

    @staticmethod
    async def on_shutdown(ctx: dict):
        from src.core.database import engine
        await engine.dispose()

    max_jobs = 3
    job_timeout = 600
```

**Step 2: Commit**

```bash
git add backend/src/workers/document_worker.py
git commit -m "feat: rewrite worker — PDF→MD+locations+embeddings+autonomous agent analysis"
```

---

## Task 9: Rewrite conversations.py — ask + review via ContractAgent

**Files:**
- Modify: `backend/src/api/conversations.py`

**Step 1: Replace the file**

```python
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
        select(Workspace).where(Workspace.id == body.workspace_id, Workspace.owner_id == current_user.id)
    )
    if not ws.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Access denied")

    await log_action(db, current_user.id, AuditAction.QA_QUERY,
                     resource_type="workspace", resource_id=body.workspace_id,
                     ip_address=request.client.host if request.client else None)
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

    await log_action(db, current_user.id, AuditAction.AI_REVIEW,
                     resource_type="document", resource_id=body.document_id,
                     ip_address=request.client.host if request.client else None)
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
```

**Step 2: Verify**

```bash
cd backend
python -c "from src.api.conversations import router; print('ok')"
```

**Step 3: Commit**

```bash
git add backend/src/api/conversations.py
git commit -m "feat: conversations — ask + analyze via ContractAgent tool loop"
```

---

## Task 10: Playbook editor API

**Files:**
- Modify: `backend/src/api/workspaces.py`

**Step 1: Add two endpoints to workspaces router**

```python
from src.services.gcs_service import GCSService

class PlaybookUpdateRequest(BaseModel):
    content: str = Field(..., min_length=10, max_length=50_000)


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
```

**Step 2: Commit**

```bash
git add backend/src/api/workspaces.py
git commit -m "feat: playbook GET/PUT endpoints for workspace skill editing"
```

---

## Task 11: Batch document upload

**Files:**
- Modify: `backend/src/api/documents.py`

**Step 1: Add batch upload endpoint**

```python
from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, Form, status
from typing import List

@router.post("/batch", status_code=status.HTTP_201_CREATED)
@limiter.limit("5/hour")
async def upload_documents_batch(
    request: Request,
    workspace_id: str = Form(...),
    party_perspective: str = Form(default="unknown"),
    files: List[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload multiple PDFs at once. Each is enqueued as a separate ARQ job."""
    if len(files) > 20:
        raise HTTPException(status_code=400, detail="Maximum 20 files per batch")

    ws_result = await db.execute(
        select(Workspace).where(Workspace.id == workspace_id, Workspace.owner_id == current_user.id)
    )
    if not ws_result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Workspace not found or access denied")

    try:
        perspective = PartyPerspective(party_perspective)
    except ValueError:
        perspective = PartyPerspective.UNKNOWN

    settings = get_settings()
    redis_settings = RedisSettings.from_dsn(settings.redis_url)
    redis = await create_pool(redis_settings)

    results = []
    for file in files:
        file_bytes = await file.read()

        if len(file_bytes) > MAX_PDF_SIZE:
            results.append({"filename": file.filename, "error": "File too large"})
            continue

        if not _validate_pdf_magic(file_bytes):
            results.append({"filename": file.filename, "error": "Not a valid PDF"})
            continue

        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        try:
            doc_id = str(uuid.uuid4())
            gcs_path = f"documents/{workspace_id}/{doc_id}/{file.filename}"
            gcs_service = GCSService()
            await gcs_service.upload_file(tmp_path, gcs_path)

            document = Document(
                id=doc_id,
                workspace_id=workspace_id,
                filename=file.filename,
                original_filename=file.filename,
                file_size=len(file_bytes),
                gcs_path=gcs_path,
                party_perspective=perspective,
                status=DocumentStatus.PENDING,
            )
            db.add(document)
            await db.flush()

            job = await redis.enqueue_job("process_document", doc_id)
            document.arq_job_id = job.job_id if job else None
            await db.commit()

            results.append({"id": doc_id, "filename": file.filename, "status": "pending"})
        finally:
            os.unlink(tmp_path)

    await redis.close()
    return {"uploaded": len([r for r in results if "id" in r]), "results": results}
```

**Step 2: Commit**

```bash
git add backend/src/api/documents.py
git commit -m "feat: POST /documents/batch for multi-file upload"
```

---

## Task 12: Portfolio search endpoint

**Files:**
- Modify: `backend/src/api/workspaces.py`

**Step 1: Add search endpoint**

```python
from src.services.workspace_tools import WorkspaceToolkit

@router.get("/{workspace_id}/search")
@limiter.limit("30/hour")
async def search_workspace(
    request: Request,
    workspace_id: str,
    q: str,
    mode: str = "fuzzy",  # exact | regex | fuzzy | semantic
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Search across all contracts in workspace."""
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
            ]
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
            ]
        }
```

**Step 2: Commit**

```bash
git add backend/src/api/workspaces.py
git commit -m "feat: GET /workspaces/{id}/search with exact/fuzzy/semantic modes"
```

---

## Task 13: Alembic migration — run and deploy

**Step 1: Run migration on Cloud SQL**

```bash
cd backend
DATABASE_URL=postgresql+asyncpg://<user>:<pass>@/<db>?host=/cloudsql/<instance> \
  alembic upgrade head
```

**Step 2: Deploy both services**

```bash
git push origin main
# CI/CD triggers deploy.yml — both contractiq-v2-api and contractiq-v2-worker redeploy
```

**Step 3: Smoke test**

```bash
BASE=https://contractiq-v2-api-<hash>.run.app

# Health check
curl $BASE/health/ready

# Auth
TOKEN=$(curl -s -X POST $BASE/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"testpass123"}' | jq -r .access_token)

# Create workspace
WS=$(curl -s -X POST $BASE/api/v2/workspaces \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Workspace"}' | jq -r .id)

# Verify playbooks were seeded
curl -s $BASE/api/v2/workspaces/$WS/playbooks/nda \
  -H "Authorization: Bearer $TOKEN" | jq .content | head -5

# Upload single PDF
DOC=$(curl -s -X POST $BASE/api/v2/documents \
  -H "Authorization: Bearer $TOKEN" \
  -F "workspace_id=$WS" \
  -F "party_perspective=vendor" \
  -F "file=@test.pdf" | jq -r .id)

# Poll for READY
curl -s "$BASE/api/v2/documents?workspace_id=$WS" \
  -H "Authorization: Bearer $TOKEN" | jq '.[0].status'

# Ask a question (stream)
curl -s -X POST $BASE/api/v2/conversations/ask \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"workspace_id\":\"$WS\",\"question\":\"What are the liability caps?\"}"

# Portfolio search
curl -s "$BASE/api/v2/workspaces/$WS/search?q=liability&mode=fuzzy" \
  -H "Authorization: Bearer $TOKEN"
```

Expected: All return 200. Document reaches READY. Agent streams analysis. Search returns matches.

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: v3 autonomous agent architecture complete"
```

---

## Summary of changes

| | Before | After |
|---|---|---|
| Pipeline steps | 9 (extract→chunk→embed→detect→persist clauses→missing→status) | 5 (PDF→MD→embed→agent analyze→READY) |
| Clause storage | PostgreSQL `clauses` table | `analysis.md` in GCS |
| Q&A | RAGAgent: vector search → Citations API | ContractAgent: reads files + optional semantic search |
| Review | ReviewAgent (Claude Code SDK, Node.js) + empty contract_excerpt | ContractAgent: reads full contract.md |
| Search | pgvector only | Exact grep + fuzzy (rapidfuzz) + semantic (pgvector) |
| Playbooks | `REQUIRED_CLAUSES` Python dict, code deploy to change | MD files in GCS, user-editable via API |
| Memory | None | `counterparties.md`, `positions.md`, `portfolio.md` — updated by agent |
| Multi-upload | Single file only | `POST /documents/batch` up to 20 files |
| Node.js dependency | Required (claude-code-sdk) | Gone |
| Lines of code | ~1400 | ~900 |
