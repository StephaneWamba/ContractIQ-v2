import asyncio
import logging
import tempfile
import os
from arq.connections import RedisSettings
from sqlalchemy import select

from src.core.config import get_settings
from src.core.database import AsyncSessionLocal
from src.models.document import Document, DocumentStatus, ContractType
from src.models.clause import Clause, ClauseType, RiskLevel
from src.services.gcs_service import GCSService
from src.services.files_api import FilesAPIService
from src.services.document_processor import DocumentProcessor
from src.services.vector_store import VectorStore
from src.agents.clause_extraction_agent import ClauseExtractionAgent

logger = logging.getLogger(__name__)


# --- Missing clause checklist per contract type ---
REQUIRED_CLAUSES: dict[str, list[str]] = {
    "saas_agreement": ["PAYMENT", "LIABILITY", "CONFIDENTIALITY", "DATA_PROCESSING", "TERMINATION", "IP_OWNERSHIP"],
    "employment": ["PAYMENT", "NON_COMPETE", "CONFIDENTIALITY", "TERMINATION", "GOVERNING_LAW"],
    "nda": ["CONFIDENTIALITY", "TERMINATION", "GOVERNING_LAW", "DISPUTE_RESOLUTION"],
    "msa": ["PAYMENT", "LIABILITY", "INDEMNIFICATION", "CONFIDENTIALITY", "TERMINATION", "GOVERNING_LAW"],
    "sow": ["PAYMENT", "ACCEPTANCE_CRITERIA", "IP_OWNERSHIP", "CHANGE_ORDER", "TERMINATION"],
    "ip_license": ["IP_OWNERSHIP", "PAYMENT", "TERMINATION", "GOVERNING_LAW"],
    "generic": ["TERMINATION", "GOVERNING_LAW"],
}


def detect_contract_type(text: str) -> ContractType:
    """Simple heuristic contract type detection from text."""
    text_lower = text[:10_000].lower()
    if any(kw in text_lower for kw in ["software as a service", "saas", "subscription fee", "api access"]):
        return ContractType.SAAS_AGREEMENT
    if any(kw in text_lower for kw in ["employment agreement", "employee agrees", "salary", "employer"]):
        return ContractType.EMPLOYMENT
    if any(kw in text_lower for kw in ["non-disclosure", "nda", "confidential information", "disclosing party"]):
        return ContractType.NDA
    if any(kw in text_lower for kw in ["master services agreement", "msa", "statement of work", "services agreement"]):
        return ContractType.MSA
    if any(kw in text_lower for kw in ["statement of work", "sow", "deliverables", "project scope"]):
        return ContractType.SOW
    if any(kw in text_lower for kw in ["license", "licensor", "licensee", "intellectual property license"]):
        return ContractType.IP_LICENSE
    return ContractType.GENERIC


def get_missing_clauses(contract_type: ContractType, extracted_types: list[str]) -> list[str]:
    """Return clause types missing for this contract type."""
    required = REQUIRED_CLAUSES.get(contract_type.value, REQUIRED_CLAUSES["generic"])
    return [c for c in required if c not in extracted_types]


async def process_document(ctx: dict, document_id: str) -> None:
    """ARQ job: full document processing pipeline."""
    settings = get_settings()

    gcs_service = GCSService()
    files_api = FilesAPIService()
    processor = DocumentProcessor()
    vector_store = VectorStore()
    extractor = ClauseExtractionAgent()

    async with AsyncSessionLocal() as db:
        # Load document
        result = await db.execute(select(Document).where(Document.id == document_id))
        document = result.scalar_one_or_none()
        if not document:
            logger.error(f"Document {document_id} not found")
            return

        document.status = DocumentStatus.PROCESSING
        await db.commit()

        tmp_path = None
        try:
            # Step 1: Download from GCS
            with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp_file:
                tmp_path = tmp_file.name
            blob = gcs_service.bucket.blob(document.gcs_path)
            await asyncio.to_thread(blob.download_to_filename, tmp_path)

            # Step 2: PyMuPDF extraction
            processed = processor.process_pdf(tmp_path)
            document.page_count = processed.page_count
            document.truncated = processed.truncated

            # Step 3: Upload to Anthropic Files API
            file_id = await files_api.upload_pdf(tmp_path)
            document.anthropic_file_id = file_id

            # Step 4: Detect contract type (heuristic, override only if GENERIC)
            if document.contract_type == ContractType.GENERIC:
                document.contract_type = detect_contract_type(processed.full_text)

            # Step 5: Embed chunks → pgvector
            # Sort chunks by (page_number, chunk_index) before batching
            sorted_chunks = sorted(
                [
                    {
                        "text": c.text,
                        "page_number": c.page_number,
                        "chunk_index": c.chunk_index,
                        "metadata": {"bbox": list(c.bbox) if c.bbox else None},
                    }
                    for c in processed.chunks
                ],
                key=lambda c: (c["page_number"] or 0, c["chunk_index"]),
            )
            chunk_count = await vector_store.add_chunks(
                db=db,
                document_id=document_id,
                workspace_id=document.workspace_id,
                chunks=sorted_chunks,
            )

            # Step 6: Update chunk_count AFTER successful embedding (null = not yet indexed = crash detection)
            document.chunk_count = chunk_count
            await db.commit()

            # Step 7: Extract clauses
            extraction = await extractor.extract(
                full_text=processed.full_text,
                contract_type=document.contract_type.value,
                party_perspective=document.party_perspective.value,
                document_id=document_id,
            )

            # Override contract_type if LLM detected a different one (only if currently GENERIC)
            if document.contract_type == ContractType.GENERIC:
                detected_type = extraction.get("contract_type_detected", "").lower().replace(" ", "_")
                for ct in ContractType:
                    if ct.value == detected_type:
                        document.contract_type = ct
                        break

            # Persist clauses
            for clause_data in extraction.get("clauses", []):
                clause_type_str = clause_data.get("clause_type", "OTHER").upper()
                try:
                    clause_type = ClauseType(clause_type_str)
                except ValueError:
                    clause_type = ClauseType.OTHER

                risk_level_str = clause_data.get("risk_level", "INFO").upper()
                try:
                    risk_level = RiskLevel(risk_level_str)
                except ValueError:
                    risk_level = RiskLevel.INFO

                clause = Clause(
                    document_id=document_id,
                    clause_type=clause_type,
                    original_text=clause_data.get("text", ""),
                    page_number=clause_data.get("page_number"),
                    risk_level=risk_level,
                    risk_reasoning=clause_data.get("risk_reasoning"),
                    jurisdiction_note=clause_data.get("jurisdiction_note"),
                    parties=clause_data.get("parties", []),
                )
                db.add(clause)

            # Step 8: Missing clause checklist
            extracted_types = []
            for clause_data in extraction.get("clauses", []):
                ct_str = clause_data.get("clause_type", "OTHER").upper()
                try:
                    ClauseType(ct_str)
                    extracted_types.append(ct_str)
                except ValueError:
                    pass  # coerced to OTHER, don't count as extracted
            missing = get_missing_clauses(document.contract_type, extracted_types)
            if missing:
                document.missing_clauses = missing

            # Step 9: Set status = READY
            document.status = DocumentStatus.READY
            document.summary = extraction.get("summary")
            await db.commit()

            logger.info(
                f"Document {document_id} processed: {chunk_count} chunks, "
                f"{len(extraction.get('clauses', []))} clauses"
            )

        except Exception as e:
            logger.error(f"Document {document_id} processing failed: {e}", exc_info=True)
            if document:
                document.status = DocumentStatus.FAILED
                document.chunk_count = 0  # visible failure signal
                document.error_message = str(e)[:500]
                await db.commit()
        finally:
            if tmp_path and os.path.exists(tmp_path):
                os.unlink(tmp_path)


class WorkerSettings:
    functions = [process_document]
    redis_settings = RedisSettings.from_dsn(os.environ.get("REDIS_URL", "redis://localhost:6379"))

    @staticmethod
    async def on_startup(ctx: dict) -> None:
        get_settings()  # validate settings on startup

    @staticmethod
    async def on_shutdown(ctx: dict) -> None:
        from src.core.database import engine
        await engine.dispose()

    max_jobs = 3  # bound memory per worker instance
    job_timeout = 600  # 10 minutes max per job
