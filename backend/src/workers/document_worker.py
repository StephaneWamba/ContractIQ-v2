import asyncio
import json
import logging
import tempfile
import os
from arq.connections import RedisSettings
from sqlalchemy import select

from src.core.config import get_settings
from src.core.database import AsyncSessionLocal
from src.models.document import Document, DocumentStatus
from src.services.gcs_service import GCSService
from src.services.document_processor import DocumentProcessor
from src.services.vector_store import VectorStore
from src.services.pii_redactor import redact_pii
from src.agents.contract_agent import ContractAgent
from src.services.workspace_tools import WorkspaceToolkit

logger = logging.getLogger(__name__)


def _build_clause_locations(
    analysis_md: str,
    locations_data: list[dict],
) -> dict[str, list[dict]]:
    """
    For each clause in analysis.md, find the best-matching bbox blocks on the
    clause's declared page. Returns { clause_type: [{page, bbox}, ...] }.

    Strategy:
    1. Parse clause type + page_number + text from analysis.md
    2. Filter locations to only that page (huge precision gain)
    3. Score each block by token overlap with clause text
    4. Keep blocks with overlap >= 30% of clause tokens
    """
    import re

    def tokenize(s: str) -> set[str]:
        return {
            w.lower()
            for w in re.findall(r"[a-zA-Z]{4,}", s)
            if w.lower() not in {
                "that", "with", "this", "from", "will", "have", "been", "they",
                "their", "shall", "which", "such", "each", "when", "then",
                "where", "vendor", "axway", "party", "agreement", "services",
                "deliverables", "herein", "thereof",
            }
        }

    # Parse clauses from analysis.md
    clause_re = re.compile(
        r"###\s+(.+?)\s+[—-]+\s*(CRITICAL|HIGH|MEDIUM|LOW)\s*\n([\s\S]*?)(?=\n###|\n##|$)",
        re.IGNORECASE,
    )
    page_re = re.compile(r"\*\*Page:\*\*\s*(\d+)")
    text_re = re.compile(r'\*\*Text:\*\*\s*"([\s\S]*?)"')

    # Group locations by page for fast lookup
    by_page: dict[int, list[dict]] = {}
    for loc in locations_data:
        by_page.setdefault(loc["page"], []).append(loc)

    result: dict[str, list[dict]] = {}

    for m in clause_re.finditer(analysis_md):
        clause_type = m.group(1).strip().upper().replace(" ", "_")
        body = m.group(3)

        page_m = page_re.search(body)
        text_m = text_re.search(body)

        if not page_m or not text_m:
            continue

        page_num = int(page_m.group(1))
        clause_text = text_m.group(1).strip()
        clause_tokens = tokenize(clause_text)

        if not clause_tokens or page_num not in by_page:
            continue

        # Score blocks on this page
        scored = []
        for loc in by_page[page_num]:
            block_tokens = tokenize(loc["text"])
            if not block_tokens:
                continue
            overlap = len(clause_tokens & block_tokens) / len(clause_tokens)
            if overlap >= 0.30:
                scored.append((overlap, loc))

        if scored:
            # Sort by overlap descending, keep top 5 blocks
            scored.sort(key=lambda x: x[0], reverse=True)
            result[clause_type] = [
                {"page": loc["page"], "bbox": loc["bbox"]}
                for _, loc in scored[:5]
            ]

    return result


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

            # Step 2: PyMuPDF → contract_md + locations
            processed = processor.process_pdf(tmp_path)
            document.page_count = processed.page_count
            document.truncated = processed.truncated

            # Step 3: Redact PII, then save contract.md to GCS
            # Raw PDF stays unredacted. Only the MD (sent to LLM) is redacted.
            region = getattr(document, "region", "us")
            redacted_md = redact_pii(processed.contract_md)
            md_path = f"workspaces/{document.workspace_id}/documents/{document_id}/contract.md"
            await gcs.write_text(md_path, redacted_md, region=region)
            document.md_path = md_path

            # Step 4: Save locations.json to GCS (for PDF highlighting)
            locations_data = [
                {"text": loc.text, "page": loc.page, "bbox": list(loc.bbox)}
                for loc in processed.locations
            ]
            locations_path = f"workspaces/{document.workspace_id}/documents/{document_id}/locations.json"
            await gcs.write_text(
                locations_path,
                json.dumps(locations_data),
                content_type="application/json",
                region=region,
            )

            # Step 5: Embed chunks → pgvector (for semantic search)
            chunks = [
                {
                    "text": loc.text,
                    "page_number": loc.page,
                    "chunk_index": i,
                    "metadata": {"bbox": list(loc.bbox)},
                }
                for i, loc in enumerate(processed.locations)
                if len(loc.text) >= 30
            ]
            await vector_store.add_chunks(
                db=db,
                document_id=document_id,
                workspace_id=document.workspace_id,
                chunks=chunks,
            )
            await db.commit()

            # Step 6: Run autonomous agent analysis
            # Agent reads contract.md + playbook → writes analysis.md + updates portfolio.md
            toolkit = WorkspaceToolkit(workspace_id=document.workspace_id, db=db)
            async for _ in agent.analyze_document(
                toolkit=toolkit,
                document_id=document_id,
                filename=document.filename,
                contract_type=document.contract_type.value,
                party_perspective=document.party_perspective.value,
            ):
                pass  # worker doesn't stream — agent writes artifacts directly to GCS

            # Step 7: Build clause_locations.json — precise per-page bbox lookup
            # Parse analysis.md to get clause type → page, then match against locations.json
            try:
                analysis_path = f"workspaces/{document.workspace_id}/documents/{document_id}/analysis.md"
                # Retry up to 3 times with backoff — GCS write from agent may need a moment
                analysis_md = None
                for attempt in range(3):
                    analysis_md = await gcs.read_text(analysis_path)
                    if analysis_md:
                        break
                    if attempt < 2:
                        await asyncio.sleep(2 ** attempt)  # 1s, 2s

                if not analysis_md:
                    logger.error(
                        f"clause_locations skipped for {document_id}: analysis.md not found in GCS "
                        f"after 3 attempts (path: {analysis_path})"
                    )
                elif not locations_data:
                    logger.error(
                        f"clause_locations skipped for {document_id}: locations_data is empty"
                    )
                else:
                    clause_locations = _build_clause_locations(analysis_md, locations_data)
                    cl_path = f"workspaces/{document.workspace_id}/documents/{document_id}/clause_locations.json"
                    await gcs.write_text(
                        cl_path,
                        json.dumps(clause_locations),
                        content_type="application/json",
                        region=region,
                    )
                    logger.info(
                        f"clause_locations written for {document_id}: {len(clause_locations)} clause types"
                    )
            except Exception as e:
                logger.exception(f"clause_locations build failed (non-fatal) for {document_id}: {e}")

            # Step 8: Mark READY
            document.status = DocumentStatus.READY
            await db.commit()

            logger.info(
                f"Document {document_id} processed: {processed.page_count} pages, "
                f"{len(chunks)} chunks embedded"
            )

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
