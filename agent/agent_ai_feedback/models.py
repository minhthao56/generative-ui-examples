"""Pydantic models for AI Feedback documents and feedback items."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class DocumentStatus(str, Enum):
    UPLOADING = "uploading"
    EXTRACTING = "extracting"
    ANALYZING = "analyzing"
    COMPLETE = "complete"
    ERROR = "error"


class RubricCategory(BaseModel):
    name: str
    description: str


class FeedbackItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    document_title: str = ""
    rubric_category: str
    excerpt: str
    explanation: str


class DocumentRecord(BaseModel):
    id: str = Field(default_factory=lambda: f"doc-{uuid.uuid4().hex[:8]}")
    file_name: str
    file_type: str  # "docx" or "pdf"
    title: str = ""
    subject: str = ""
    extracted_text: str = ""
    rubric_categories: list[RubricCategory] = Field(default_factory=list)
    status: DocumentStatus = DocumentStatus.UPLOADING
    feedback_items: list[FeedbackItem] = Field(default_factory=list)
    feedback_count: int = 0
    is_truncated: bool = False
    error_message: Optional[str] = None
    created_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    file_path: Optional[str] = None  # Server-side path to uploaded file
