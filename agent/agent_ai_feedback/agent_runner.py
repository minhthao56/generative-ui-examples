"""Runs the ADK agent pipeline (OCR → Rubric → Feedback) programmatically.

Per the pipeline diagram:
- Step 1 (parallel): OCR Agent (text→title+subject) + Page-to-Image (doc→images)
- Step 2: Rubric Agent (text+images+title+subject → rubric categories)
- Step 3: Feedback Agent (text+images+rubric+title+subject → feedback items)
"""

from __future__ import annotations

import asyncio
import json
import logging

from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

from .agents.ocr_agent import create_ocr_agent
from .agents.rubric_agent import create_rubric_agent
from .agents.feedback_agent import create_feedback_agent
from .tools.page_to_image import document_to_images

logger = logging.getLogger(__name__)

APP_NAME = "ai_feedback"

# Max text length sent to each agent prompt (~50k chars ≈ ~12k tokens)
MAX_PROMPT_TEXT_LENGTH = 50_000
# Max pages to include as images
MAX_IMAGE_PAGES = 5


def _build_image_parts(file_path: str) -> list[types.Part]:
    """Convert document pages to genai image Parts for multimodal input."""
    try:
        page_images = document_to_images(file_path)
        parts = []
        for i, img_bytes in enumerate(page_images[:MAX_IMAGE_PAGES]):
            parts.append(
                types.Part(
                    inline_data=types.Blob(
                        mime_type="image/png",
                        data=img_bytes,
                    )
                )
            )
        if parts:
            logger.info(f"Built {len(parts)} image parts from document")
        return parts
    except Exception as e:
        logger.warning(f"Failed to build image parts: {e}. Using text-only.")
        return []


def _truncate_text(text: str) -> str:
    """Truncate text for agent prompts."""
    if len(text) > MAX_PROMPT_TEXT_LENGTH:
        return text[:MAX_PROMPT_TEXT_LENGTH]
    return text


async def run_agents_pipeline(extracted_text: str, file_path: str) -> dict:
    """Run the 3-agent pipeline and return combined results.

    Returns:
        dict with keys: generated_title, detected_subject, rubric_categories, feedback_items
    """
    session_service = InMemorySessionService()
    text_preview = _truncate_text(extracted_text)

    # === STEP 1 (parallel): OCR Agent + Page-to-Image ===
    # Run both concurrently
    ocr_task = asyncio.create_task(
        _run_ocr_agent(session_service, text_preview)
    )
    # Page-to-image is sync, run in thread pool
    loop = asyncio.get_event_loop()
    image_task = loop.run_in_executor(None, _build_image_parts, file_path)

    ocr_result, image_parts = await asyncio.gather(ocr_task, image_task)

    generated_title = ocr_result.get("generated_title", "Untitled Document")
    detected_subject = ocr_result.get("detected_subject", "General")
    logger.info(f"OCR: title='{generated_title}', subject='{detected_subject}', images={len(image_parts)}")

    # === STEP 2: Rubric Agent ===
    rubric_categories = await _run_rubric_agent(
        session_service, text_preview, image_parts, generated_title, detected_subject
    )
    logger.info(f"Rubric: {len(rubric_categories)} categories")

    # === STEP 3: Feedback Agent ===
    feedback_items = await _run_feedback_agent(
        session_service, text_preview, image_parts,
        generated_title, detected_subject, rubric_categories
    )
    logger.info(f"Feedback: {len(feedback_items)} items")

    return {
        "generated_title": generated_title,
        "detected_subject": detected_subject,
        "rubric_categories": rubric_categories,
        "feedback_items": feedback_items,
    }


async def _run_ocr_agent(
    session_service: InMemorySessionService,
    text_preview: str,
) -> dict:
    """Run OCR agent to generate title and detect subject."""
    ocr_agent = create_ocr_agent()
    runner = Runner(
        agent=ocr_agent, app_name=APP_NAME, session_service=session_service
    )
    session = await session_service.create_session(
        app_name=APP_NAME, user_id="pipeline"
    )

    message = types.Content(
        role="user",
        parts=[
            types.Part.from_text(
                text=f"Analyze this document and generate a title and detect the subject:\n\n{text_preview}"
            ),
        ],
    )

    async for event in runner.run_async(
        user_id="pipeline", session_id=session.id, new_message=message
    ):
        pass

    updated = await session_service.get_session(
        app_name=APP_NAME, user_id="pipeline", session_id=session.id
    )
    return {
        "generated_title": updated.state.get("generated_title", "Untitled Document"),
        "detected_subject": updated.state.get("detected_subject", "General"),
    }


async def _run_rubric_agent(
    session_service: InMemorySessionService,
    text_preview: str,
    image_parts: list[types.Part],
    generated_title: str,
    detected_subject: str,
) -> list[dict]:
    """Run Rubric agent with text + images to generate rubric categories."""
    rubric_agent = create_rubric_agent()
    runner = Runner(
        agent=rubric_agent, app_name=APP_NAME, session_service=session_service
    )
    session = await session_service.create_session(
        app_name=APP_NAME, user_id="pipeline",
        state={
            "generated_title": generated_title,
            "detected_subject": detected_subject,
        },
    )

    # Build multimodal message: text + document page images
    parts = [
        types.Part.from_text(
            text=(
                f"Generate rubric categories for this document.\n"
                f"Title: {generated_title}\n"
                f"Subject: {detected_subject}\n\n"
                f"Document text:\n{text_preview}"
            )
        ),
    ]
    if image_parts:
        parts.append(types.Part.from_text(text="\n\nDocument page images for additional context:"))
        parts.extend(image_parts)

    message = types.Content(role="user", parts=parts)

    async for event in runner.run_async(
        user_id="pipeline", session_id=session.id, new_message=message
    ):
        pass

    updated = await session_service.get_session(
        app_name=APP_NAME, user_id="pipeline", session_id=session.id
    )
    return updated.state.get("rubric_categories", [])


async def _run_feedback_agent(
    session_service: InMemorySessionService,
    text_preview: str,
    image_parts: list[types.Part],
    generated_title: str,
    detected_subject: str,
    rubric_categories: list[dict],
) -> list[dict]:
    """Run Feedback agent with text + images + rubric to generate feedback items."""
    feedback_agent = create_feedback_agent()
    runner = Runner(
        agent=feedback_agent, app_name=APP_NAME, session_service=session_service
    )

    categories_str = json.dumps(rubric_categories, indent=2)
    session = await session_service.create_session(
        app_name=APP_NAME, user_id="pipeline",
        state={
            "generated_title": generated_title,
            "detected_subject": detected_subject,
            "rubric_categories": categories_str,
        },
    )

    # Build multimodal message: text + document page images
    parts = [
        types.Part.from_text(
            text=(
                f"Evaluate this document and generate feedback items.\n"
                f"Title: {generated_title}\n"
                f"Subject: {detected_subject}\n"
                f"Rubric categories:\n{categories_str}\n\n"
                f"Document text:\n{text_preview}"
            )
        ),
    ]
    if image_parts:
        parts.append(types.Part.from_text(text="\n\nDocument page images for visual context:"))
        parts.extend(image_parts)

    message = types.Content(role="user", parts=parts)

    async for event in runner.run_async(
        user_id="pipeline", session_id=session.id, new_message=message
    ):
        pass

    updated = await session_service.get_session(
        app_name=APP_NAME, user_id="pipeline", session_id=session.id
    )
    return updated.state.get("feedback_items", [])
