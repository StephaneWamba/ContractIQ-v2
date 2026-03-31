import uuid
import tempfile
import os
from typing import List
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, Form, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from arq import create_pool
from arq.connections import RedisSettings
from src.core.database import get_db
from src.core.auth import get_current_user
from src.core.rate_limit import limiter
from src.core.audit import log_action
from src.core.config import get_settings
from src.models.user import User
from src.models.document import Document, DocumentStatus, PartyPerspective
from src.models.workspace import Workspace
from src.models.audit_log import AuditAction
from src.services.gcs_service import GCSService
from src.services.vector_store import VectorStore

router = APIRouter(prefix="/documents", tags=["documents"])

MAX_PDF_SIZE = 50 * 1024 * 1024  # 50 MB


def _validate_pdf_magic(file_bytes: bytes) -> bool:
    """Validate PDF by magic bytes (starts with %PDF-)"""
    return file_bytes[:5] == b"%PDF-"


@router.post("", status_code=status.HTTP_201_CREATED)
@limiter.limit("20/hour")
async def upload_document(
    request: Request,
    workspace_id: str = Form(...),
    party_perspective: str = Form(default="unknown"),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    settings = get_settings()

    # Ownership check
    ws_result = await db.execute(
        select(Workspace).where(Workspace.id == workspace_id, Workspace.owner_id == current_user.id)
    )
    if not ws_result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Workspace not found or access denied")

    # Enforce file size limit before reading into memory
    if file.size and file.size > MAX_PDF_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 50 MB.")

    # Read file and validate magic bytes
    file_bytes = await file.read()
    if not _validate_pdf_magic(file_bytes):
        raise HTTPException(status_code=400, detail="File must be a valid PDF")

    # Validate party_perspective
    try:
        perspective = PartyPerspective(party_perspective)
    except ValueError:
        perspective = PartyPerspective.UNKNOWN

    # Write to temp file for GCS upload
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name

    try:
        # Create document record
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

        # Enqueue ARQ job
        redis_settings = RedisSettings.from_dsn(settings.redis_url)
        redis = await create_pool(redis_settings)
        job = await redis.enqueue_job("process_document", doc_id)
        await redis.close()

        document.arq_job_id = job.job_id if job else None
        await db.commit()

        await log_action(db, current_user.id, AuditAction.DOCUMENT_UPLOAD,
                        resource_type="document", resource_id=doc_id,
                        ip_address=request.client.host if request.client else None)
        await db.commit()

        return {"id": doc_id, "status": document.status.value, "filename": file.filename}
    finally:
        os.unlink(tmp_path)


@router.get("")
async def list_documents(
    workspace_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = 50,
    offset: int = 0,
):
    # Ownership check
    ws_result = await db.execute(
        select(Workspace).where(Workspace.id == workspace_id, Workspace.owner_id == current_user.id)
    )
    if not ws_result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Access denied")

    result = await db.execute(
        select(Document)
        .where(Document.workspace_id == workspace_id)
        .order_by(Document.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    docs = result.scalars().all()
    return [
        {
            "id": d.id,
            "filename": d.filename,
            "status": d.status.value,
            "contract_type": d.contract_type.value if d.contract_type else None,
            "party_perspective": d.party_perspective.value if d.party_perspective else None,
            "page_count": d.page_count,
            "created_at": d.created_at.isoformat() if d.created_at else None,
        }
        for d in docs
    ]


@router.get("/{document_id}/analysis")
async def get_analysis(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return analysis.md content written by the agent after processing."""
    doc = await _get_owned_document(document_id, current_user.id, db)
    if doc.status != DocumentStatus.READY:
        raise HTTPException(status_code=404, detail="Analysis not ready yet")
    gcs_service = GCSService()
    path = f"workspaces/{doc.workspace_id}/documents/{document_id}/analysis.md"
    content = await gcs_service.read_text(path)
    if content is None:
        raise HTTPException(status_code=404, detail="Analysis file not found")
    return {"content": content}


@router.get("/{document_id}/pdf")
async def get_pdf_proxy(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Proxy the PDF through the API to avoid GCS CORS issues in the browser."""
    from fastapi.responses import Response as FastAPIResponse
    doc = await _get_owned_document(document_id, current_user.id, db)
    if not doc.gcs_path:
        raise HTTPException(status_code=404, detail="PDF not available")
    gcs_service = GCSService()
    blob = gcs_service.bucket.blob(doc.gcs_path)
    import asyncio
    data = await asyncio.to_thread(blob.download_as_bytes)
    return FastAPIResponse(
        content=data,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{doc.filename}"'},
    )


@router.get("/{document_id}/clause-locations")
async def get_clause_locations(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return clause_locations.json — precise per-clause bbox data for PDF highlighting."""
    doc = await _get_owned_document(document_id, current_user.id, db)
    gcs_service = GCSService()
    path = f"workspaces/{doc.workspace_id}/documents/{document_id}/clause_locations.json"
    content = await gcs_service.read_text(path)
    if content is None:
        raise HTTPException(status_code=404, detail="Clause locations not available")
    import json as _json
    return _json.loads(content)


@router.get("/{document_id}/locations")
async def get_locations(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return locations.json — per-block bbox data for PDF highlighting."""
    doc = await _get_owned_document(document_id, current_user.id, db)
    gcs_service = GCSService()
    path = f"workspaces/{doc.workspace_id}/documents/{document_id}/locations.json"
    content = await gcs_service.read_text(path)
    if content is None:
        raise HTTPException(status_code=404, detail="Locations not available")
    import json as _json
    return _json.loads(content)


@router.post("/{document_id}/backfill-clause-locations", status_code=200)
async def backfill_clause_locations(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Backfill clause_locations.json for existing documents that were processed before this feature."""
    import json as _json
    from src.workers.document_worker import _build_clause_locations

    doc = await _get_owned_document(document_id, current_user.id, db)
    gcs_service = GCSService()

    analysis_path = f"workspaces/{doc.workspace_id}/documents/{document_id}/analysis.md"
    locations_path = f"workspaces/{doc.workspace_id}/documents/{document_id}/locations.json"

    analysis_md = await gcs_service.read_text(analysis_path)
    locations_raw = await gcs_service.read_text(locations_path)

    if not analysis_md or not locations_raw:
        raise HTTPException(status_code=404, detail="analysis.md or locations.json not found")

    locations_data = _json.loads(locations_raw)
    clause_locations = _build_clause_locations(analysis_md, locations_data)

    cl_path = f"workspaces/{doc.workspace_id}/documents/{document_id}/clause_locations.json"
    await gcs_service.write_text(cl_path, _json.dumps(clause_locations), content_type="application/json")

    return {"clause_types": list(clause_locations.keys()), "count": len(clause_locations)}


@router.get("/{document_id}/pdf-url")
async def get_pdf_url(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns a 15-minute GCS signed URL. Never puts token in URL."""
    doc = await _get_owned_document(document_id, current_user.id, db)
    if not doc.gcs_path:
        raise HTTPException(status_code=404, detail="PDF not available")

    gcs_service = GCSService()
    url = gcs_service.get_signed_url(doc.gcs_path)
    return {"url": url, "expires_in_seconds": 900}


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = await _get_owned_document(document_id, current_user.id, db)

    # Cascade delete: GCS + Anthropic Files API + pgvector chunks
    gcs_service = GCSService()
    if doc.gcs_path:
        await gcs_service.delete_file(doc.gcs_path)

    vector_store = VectorStore()
    await vector_store.delete_document_chunks(db, document_id)

    await db.delete(doc)

    await log_action(db, current_user.id, AuditAction.DOCUMENT_DELETE,
                    resource_type="document", resource_id=document_id,
                    ip_address=request.client.host if request.client else None)
    await db.commit()


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
    return {
        "uploaded": len([r for r in results if "id" in r]),
        "results": results,
    }


async def _get_owned_document(document_id: str, user_id: str, db: AsyncSession) -> Document:
    result = await db.execute(
        select(Document)
        .join(Workspace, Document.workspace_id == Workspace.id)
        .where(Document.id == document_id, Workspace.owner_id == user_id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc
