"""Background pipeline runner for AI Feedback document analysis."""

from __future__ import annotations

import logging
import traceback

from .models import DocumentStatus, FeedbackItem, RubricCategory
from .store import document_store
from .tools.extract_text import extract_text_from_file

logger = logging.getLogger(__name__)

# Maximum characters of extracted text to send to AI (approx ~100k tokens)
MAX_TEXT_LENGTH = 400_000


async def run_analysis_pipeline(doc_id: str) -> None:
    """Run the full analysis pipeline for a document.

    Steps:
    1. Extract text from uploaded file
    2. Generate title + detect subject (OCR agent)
    3. Generate rubric categories (Rubric agent)
    4. Generate feedback items (Feedback agent)

    On failure, retries once, then marks document as error.
    """
    try:
        await _run_pipeline(doc_id)
    except Exception:
        logger.warning(f"Pipeline failed for {doc_id}, retrying once...")
        try:
            await _run_pipeline(doc_id)
        except Exception as e:
            logger.error(f"Pipeline failed for {doc_id} after retry: {e}")
            document_store.update_document(
                doc_id,
                status=DocumentStatus.ERROR,
                error_message=f"Analysis failed: {str(e)}",
            )


async def _run_pipeline(doc_id: str) -> None:
    """Internal pipeline execution."""
    doc = document_store.get_document(doc_id)
    if not doc:
        raise ValueError(f"Document {doc_id} not found")

    # Step 1: Extract text
    document_store.update_document(doc_id, status=DocumentStatus.EXTRACTING)
    extracted_text = extract_text_from_file(doc.file_path)

    is_truncated = False
    if len(extracted_text) > MAX_TEXT_LENGTH:
        extracted_text = extracted_text[:MAX_TEXT_LENGTH]
        is_truncated = True

    document_store.update_document(
        doc_id,
        extracted_text=extracted_text,
        is_truncated=is_truncated,
        status=DocumentStatus.ANALYZING,
    )

    # Steps 2-4: Run ADK agents (OCR → Rubric → Feedback)
    from .agent_runner import run_agents_pipeline

    result = await run_agents_pipeline(extracted_text, doc.file_path)

    # Update document with results
    document_store.update_document(
        doc_id,
        title=result["generated_title"],
        subject=result["detected_subject"],
        rubric_categories=[
            RubricCategory(**cat).model_dump() for cat in result["rubric_categories"]
        ],
        feedback_items=[
            FeedbackItem(
                document_title=result["generated_title"],
                rubric_category=item["rubric_category"],
                excerpt=item["excerpt"],
                explanation=item["explanation"],
            ).model_dump()
            for item in result["feedback_items"]
        ],
        feedback_count=len(result["feedback_items"]),
        status=DocumentStatus.COMPLETE,
    )
