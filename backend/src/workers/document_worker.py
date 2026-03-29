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

            # Step 7: Mark READY
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
