"""REST API routes for AI Feedback document management."""

from __future__ import annotations

import asyncio
import logging
import os
import shutil
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, HTTPException, UploadFile

from .models import DocumentRecord, DocumentStatus
from .pipeline import run_analysis_pipeline
from .store import document_store

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/documents", tags=["ai-feedback"])

UPLOADS_DIR = Path(__file__).parent.parent / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB
ALLOWED_EXTENSIONS = {".docx", ".pdf"}


@router.post("/upload")
async def upload_document(file: UploadFile, background_tasks: BackgroundTasks):
    """Upload a document for AI feedback analysis."""
    # Validate file type
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {ext}. Only .docx and .pdf are supported.",
        )

    # Read file and validate size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large ({len(content) / 1024 / 1024:.1f} MB). Maximum is 20 MB.",
        )

    # Create document record
    file_type = "docx" if ext == ".docx" else "pdf"
    doc = DocumentRecord(
        file_name=file.filename,
        file_type=file_type,
    )

    # Save file to disk
    file_path = UPLOADS_DIR / f"{doc.id}{ext}"
    with open(file_path, "wb") as f:
        f.write(content)
    doc.file_path = str(file_path)

    # Persist document record
    document_store.create_document(doc)

    # Run analysis pipeline in background
    background_tasks.add_task(_run_pipeline_async, doc.id)

    return {"id": doc.id, "status": doc.status.value}


async def _run_pipeline_async(doc_id: str):
    """Wrapper to run async pipeline from background task."""
    await run_analysis_pipeline(doc_id)


@router.get("")
async def list_documents():
    """List all documents."""
    docs = document_store.list_documents()
    return [_serialize_doc(d) for d in docs]


@router.get("/{doc_id}")
async def get_document(doc_id: str):
    """Get a document by ID with its feedback."""
    doc = document_store.get_document(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return _serialize_doc(doc)


@router.post("/{doc_id}/retry")
async def retry_document(doc_id: str, background_tasks: BackgroundTasks):
    """Retry a failed document analysis."""
    doc = document_store.get_document(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.status != DocumentStatus.ERROR:
        raise HTTPException(status_code=400, detail="Document is not in error state")

    # Reset status and re-run pipeline
    document_store.update_document(
        doc_id, status=DocumentStatus.UPLOADING, error_message=None
    )
    background_tasks.add_task(_run_pipeline_async, doc_id)

    return {"id": doc_id, "status": "uploading"}


def _serialize_doc(doc: DocumentRecord) -> dict:
    """Serialize a DocumentRecord for API response (exclude internal fields)."""
    data = doc.model_dump()
    data.pop("file_path", None)  # Don't expose server paths
    return data
