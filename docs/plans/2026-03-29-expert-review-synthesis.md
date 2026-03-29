# ContractIQ v2 — Expert Review Synthesis
**Date:** 2026-03-29
**Experts:** Legal Domain, AI/ML Systems, Infrastructure/SRE, Security, Performance, Data Architecture

---

## CRITICAL — Must Fix Before Any Code Is Written

### C1 — Replace ChromaDB with pgvector
**Source:** AI/ML, Infrastructure, Performance (all independently flagged)**

ChromaDB PersistentClient writes to the container filesystem. On Cloud Run (stateless containers), every restart/deploy/scale-down wipes ALL vector data. Silence — no error, documents show `status=READY` in DB but Q&A returns nothing. No re-index trigger exists.

**Decision:** Use **pgvector** extension on the existing PostgreSQL database.
- Zero new infrastructure (Postgres is already required)
- Persistent by definition (Cloud SQL has durable storage)
- SQLAlchemy already in the stack — add `pgvector` extension + `sqlalchemy-pgvector`
- Store embeddings as `vector(1024)` columns (voyage-law-2 outputs 1024 dims)
- Replace ChromaDB cosine search with `<=>` operator (cosine distance in pgvector)
- Remove `chromadb` dependency entirely → image shrinks ~300MB, cold start improves ~10s

### C2 — Replace Ephemeral File Storage with GCS
**Source:** Security, Infrastructure, Performance**

Uploaded PDFs saved to `./uploads` in the container. Lost on every restart. `FileResponse` 404s after deploy. Users see processed documents they can never retrieve again.

**Decision:** Store PDFs in **Google Cloud Storage (GCS)**.
- Upload to GCS on ingest, store GCS object key in `documents.gcs_path`
- Serve via signed URLs (time-limited, no auth header needed for PDF viewer)
- Delete from GCS when document is deleted (cascade)
- Also required for Anthropic Files API deletion (delete both GCS + Anthropic file)

### C3 — ARQ Worker Must Be Implemented (Not BackgroundTasks)
**Source:** Infrastructure, Performance**

`BackgroundTasks` runs in uvicorn's thread pool. On container restart (every deploy), in-flight jobs die silently — document stuck at `PROCESSING` forever. No queue depth visibility, no retry, no durability.

**Decision:** ARQ with Redis (already in the plan). Confirmed correct.
- Move ALL processing to ARQ jobs: `process_document`, `extract_clauses`
- Store ARQ job_id on the Document record for status tracking
- Worker Cloud Run: `--min-instances 1`, `--cpu-always-allocated` (mandatory for polling)
- Max 3 concurrent jobs per worker instance to bound memory

### C4 — JWT Secret Must Have No Default + Startup Validation
**Source:** Security, AI/ML**

`secret_key: str = "your-secret-key-change-in-production"` default in config. If not overridden in GCP Secret Manager, all JWTs are forgeable. Live API key committed to git in v1.

**Decision:**
```python
secret_key: str  # No default — pydantic-settings raises at startup if missing
```
Add startup check: if env is `production` and key len < 32, refuse to start.

### C5 — Unauthenticated Delete Endpoint
**Source:** Security**

`DELETE /conversations/{id}` has no `get_current_user` dependency in v1. Any user can delete any conversation. Must not be replicated in v2.

**Decision:** Every mutation endpoint requires authentication + ownership verification.

---

## HIGH — Must Fix in v2 Architecture

### H1 — pgvector Schema: Add `document_chunks` Table
Replace ChromaDB with a proper table:
```sql
CREATE TABLE document_chunks (
    id UUID PRIMARY KEY,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id),
    page_number INTEGER,
    chunk_index INTEGER,
    text TEXT NOT NULL,
    embedding vector(1024),  -- voyage-law-2 output dim
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX ON document_chunks (document_id);
CREATE INDEX ON document_chunks (workspace_id);
```

### H2 — Add Missing Database Indexes
**Source:** Performance**

These are missing in v1 and will cause full table scans:
```sql
CREATE INDEX ON documents (workspace_id);
CREATE INDEX ON clauses (document_id);
CREATE INDEX ON clauses (document_id, clause_type);
CREATE INDEX ON conversations (workspace_id);
CREATE INDEX ON conversation_messages (conversation_id);
```
Must be in the initial Alembic migration.

### H3 — Contract Type Detection → Persist + Use Downstream
**Source:** Legal Domain**

V1 detects contract type but throws it away. V2 must:
1. Detect type during processing (`saas_agreement`, `employment`, `nda`, `msa`, `sow`, `generic`)
2. Persist on `Document.contract_type` column
3. Pass to Claude extraction prompt (changes risk calibration per type)
4. Use in post-extraction missing-clause checklist

### H4 — Party Perspective Input
**Source:** Legal Domain**

Risk is directional. A liability cap is good for the vendor, bad for the customer. Add at upload:
```python
class DocumentUploadRequest:
    party_perspective: Literal["vendor", "customer", "employer", "employee", "licensor", "licensee", "unknown"] = "unknown"
```
Pass to extraction prompt and review agent. Changes risk scoring for asymmetric clauses.

### H5 — Post-Extraction Missing Clause Checklist
**Source:** Legal Domain**

After extraction, compare extracted clause types against the expected set for the contract type:
```python
REQUIRED_CLAUSES = {
    "saas_agreement": ["PAYMENT", "LIABILITY", "CONFIDENTIALITY", "DATA_PROCESSING", "TERMINATION", "IP_OWNERSHIP"],
    "employment": ["PAYMENT", "NON_COMPETE", "CONFIDENTIALITY", "TERMINATION", "GOVERNING_LAW"],
    ...
}
missing = set(REQUIRED_CLAUSES[contract_type]) - set(extracted_types)
# Store as document-level risk flags, not clause-level
```

### H6 — Page Number Accuracy: Inject Page Markers
**Source:** Data Architecture**

LLM must infer page numbers from character offsets — it guesses wrong for pages starting mid-sentence. Fix: inject explicit markers into the text before sending to Claude.
```python
full_text = ""
for page_num, page in enumerate(doc, start=1):
    full_text += f"\n\n--- PAGE {page_num} ---\n\n"
    full_text += page.get_text()
```
Now page attribution is exact — Claude reads the marker, not infers from offsets.

### H7 — Sort Chunks by Page Before Batching for Extraction
**Source:** Data Architecture**

pgvector's `ORDER BY embedding <=> $query` returns by similarity, not document order. Before batching chunks for clause extraction, sort by `(page_number, chunk_index)`. One-line fix with measurable accuracy improvement for multi-page clauses.

### H8 — Similarity Threshold Must Be Meaningful
**Source:** Data Architecture, Performance**

V1 uses `-0.3` (nearly everything passes). For voyage-law-2 with cosine similarity, set threshold to `0.15`. Return a `low_confidence: bool` flag on Q&A responses when top result scores below `0.30`.

### H9 — Rate Limiting on All Endpoints
**Source:** Security, Performance**

No rate limiting anywhere in v1. Brute-force login, cost-amplification attacks, storage exhaustion all possible.

Add `slowapi` middleware:
- Login: 5/min per IP
- Register: 3/hour per IP
- Document upload: 20/hour per user
- Clause extraction: 10/hour per user
- Q&A: 50/hour per user
- AI review: 5/hour per user

### H10 — Deduplication Pre-Filter (Embedding Similarity)
**Source:** Data Architecture, Performance**

V1 makes one LLM call per clause pair comparison — O(n²). For large contracts this creates 100+ LLM calls just for deduplication. In v2, use pgvector cosine similarity as a pre-filter: only invoke Claude for pairs with similarity > 0.92. Reduces LLM calls by ~90%.

### H11 — GCS Signed URLs for PDF Serving
**Source:** Security**

Never put JWT in URL query parameters (logged by every proxy/CDN). Use GCS signed URLs for PDF serving:
```python
blob = bucket.blob(document.gcs_path)
url = blob.generate_signed_url(expiration=timedelta(minutes=15))
```

### H12 — Add Audit Logging Table
**Source:** Security**

Required for SOC 2 and enterprise legal customers:
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY,
    user_id UUID,
    action VARCHAR(50),  -- LOGIN, UPLOAD, DELETE, EXTRACT, QA, REVIEW, EXPORT
    resource_type VARCHAR(50),
    resource_id UUID,
    ip_address INET,
    outcome VARCHAR(10),  -- success/failure
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);
-- Append-only: no UPDATE or DELETE permissions for app user
```

### H13 — DOCX Page Numbers Are Fabricated
**Source:** Data Architecture**

V1 uses 2000 chars/page approximation — off by 2-3x. For DOCX in v2:
- Use `python-docx` page break detection for true page boundaries
- If breaks unavailable, set `page_number = null` and label as "section" in UI

### H14 — Header/Footer Stripping in PyMuPDF
**Source:** Data Architecture**

Running headers ("CONFIDENTIAL — EXECUTION COPY") and footers (page numbers, firm names) appear on every page and pollute RAG results. Strip blocks in top 8% or bottom 8% of page height. Also detect multi-column layouts and sort blocks correctly.

### H15 — Deep Health Check Endpoint
**Source:** Infrastructure**

`/health` must test actual dependencies, not just return 200:
```python
@app.get("/health/ready")
async def health_ready():
    # Test DB connection
    await db.execute("SELECT 1")
    # Test Redis
    await redis.ping()
    # Test pgvector table exists
    return {"status": "ready", "db": "ok", "redis": "ok"}
```
Cloud Run routes no traffic to unhealthy instances.

---

## MEDIUM — Important but Not Blocking

### M1 — Add Expanded Clause Taxonomy
**Source:** Legal Domain**

Add missing types: `PRICE_ADJUSTMENT`, `AUDIT_RIGHTS`, `CHANGE_ORDER`, `ACCEPTANCE_CRITERIA`, `KEY_PERSONNEL`, `LIQUIDATED_DAMAGES`, `MFN` (most favored nation), `BENCHMARKING`.

### M2 — Cross-Document Context Second Pass for Risk
**Source:** Legal Domain**

After all clauses extracted, run a second-pass Claude call with the full clause list visible. This enables:
- Carve-out awareness (unlimited liability + carve-out = not actually CRITICAL)
- Interplay detection (weak indemnification + strong insurance = lower net risk)
- Cross-reference resolution (termination references cure period defined elsewhere)

### M3 — JWT Revocation via Redis Blocklist
**Source:** Security**

Add `jti` claim to JWTs. On logout, add `jti` to Redis with TTL = remaining token validity. Check blocklist on every authenticated request.

### M4 — Replace python-jose with PyJWT
**Source:** Security**

`python-jose` has CVE history and is less maintained. `PyJWT` is actively maintained with regular security audits. Drop-in replacement.

### M5 — File Type Validation by Magic Bytes
**Source:** Security**

Extension-only validation allows `malware.pdf` that is actually an executable. Add `python-magic` to validate actual MIME type from file header bytes.

### M6 — Add Anthropic Files API Deletion on Document Delete
**Source:** Security**

When user deletes a document, must delete from Anthropic Files API:
```python
await anthropic_client.beta.files.delete(document.anthropic_file_id)
```
Also delete from GCS. Cascade must be explicit in the delete endpoint.

### M7 — Add Pagination to List Endpoints
**Source:** Performance**

All list endpoints return unlimited rows. Add:
```python
@router.get("", response_model=PaginatedResponse[DocumentResponse])
async def list_documents(limit: int = 50, offset: int = 0, ...):
```

### M8 — Async RAG Endpoint
**Source:** Performance**

Q&A endpoint is synchronous → blocks uvicorn thread for 1-5 seconds. Make `async def` and convert all downstream service calls to use `asyncio`-native clients (`anthropic.AsyncAnthropic`, `asyncpg` for pgvector queries, `aioredis`).

### M9 — Contract Summary as First Output
**Source:** Legal Domain**

Before clause-level analysis, generate a document summary: parties, purpose, effective date, term, governing law, key commercial terms. First thing legal professionals want. Can be a separate lightweight Claude call.

### M10 — Clause Correction API
**Source:** Legal Domain**

Add `PATCH /clauses/{clause_id}` for user corrections (type, risk_level, risk_reasoning). Without this, users have no recourse when AI is wrong. Required for professional use.

---

## Design Decisions Confirmed (No Change Needed)

| Decision | Confirmed by |
|---|---|
| Anthropic Opus 4.6 (not gpt-4o-mini) | Legal, AI/ML (quality requirement for legal risk) |
| voyage-law-2 embeddings | Data Architecture (ALL-CAPS handling, legal domain training) |
| Anthropic Citations API (no regex) | AI/ML (eliminates 60+ lines of manual citation cleanup) |
| ARQ for background jobs | Infrastructure, Performance |
| Claude Agent SDK for open-ended review | AI/ML (confirmed Agent SDK is correct tool for this) |
| Claude Skills for domain expertise | Legal (Skills provide jurisdiction + taxonomy context) |
| GCP Cloud Run (not Fly.io) | Infrastructure |
| Alembic migrations | Infrastructure |
| FastAPI + SQLAlchemy 2.0 async | Performance |

---

## Updated Architecture: What Changes vs. Original Plan

| Original Plan | Updated Decision |
|---|---|
| ChromaDB PersistentClient | **pgvector on PostgreSQL** |
| Files stored on container filesystem | **GCS bucket** |
| ChromaDB collection per workspace | **pgvector table with workspace_id index** |
| Similarity threshold -0.3 | **0.15** |
| No contract type persistence | **Document.contract_type column** |
| No party perspective | **DocumentUploadRequest.party_perspective** |
| No missing clause detection | **Post-extraction checklist per contract type** |
| No rate limiting | **slowapi middleware** |
| No audit logging | **audit_logs table** |
| No chunk dedup pre-filter | **pgvector similarity pre-filter (> 0.92)** |
| Page numbers by LLM offset inference | **Injected PAGE N markers in text** |
| Raw `get_text()` extraction | **`get_text("dict")` with column detection + header stripping** |
| Secret key has default | **Required field, no default** |
| python-jose | **PyJWT** |
| JWT in URL for PDF serving | **GCS signed URLs** |
| No health check depth | **Deep `/health/ready` testing DB + Redis** |
