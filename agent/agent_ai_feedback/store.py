"""JSON file-based document store for AI Feedback persistence."""

from __future__ import annotations

import json
import threading
from pathlib import Path
from typing import Optional

from .models import DocumentRecord, DocumentStatus

DATA_DIR = Path(__file__).parent.parent / "data"
STORE_PATH = DATA_DIR / "documents.json"


class DocumentStore:
    """Thread-safe JSON file store for document records."""

    def __init__(self, path: Path = STORE_PATH):
        self._path = path
        self._lock = threading.Lock()
        self._path.parent.mkdir(parents=True, exist_ok=True)
        if not self._path.exists():
            self._write([])

    def _read(self) -> list[dict]:
        with open(self._path, "r") as f:
            return json.load(f)

    def _write(self, data: list[dict]) -> None:
        with open(self._path, "w") as f:
            json.dump(data, f, indent=2, default=str)

    def create_document(self, doc: DocumentRecord) -> DocumentRecord:
        with self._lock:
            docs = self._read()
            docs.append(doc.model_dump())
            self._write(docs)
        return doc

    def get_document(self, doc_id: str) -> Optional[DocumentRecord]:
        docs = self._read()
        for d in docs:
            if d["id"] == doc_id:
                return DocumentRecord(**d)
        return None

    def list_documents(self) -> list[DocumentRecord]:
        docs = self._read()
        return [DocumentRecord(**d) for d in docs]

    def update_document(self, doc_id: str, **updates) -> Optional[DocumentRecord]:
        with self._lock:
            docs = self._read()
            for i, d in enumerate(docs):
                if d["id"] == doc_id:
                    d.update(updates)
                    # Recompute feedback_count if feedback_items updated
                    if "feedback_items" in updates:
                        d["feedback_count"] = len(updates["feedback_items"])
                    docs[i] = d
                    self._write(docs)
                    return DocumentRecord(**d)
        return None

    def delete_document(self, doc_id: str) -> bool:
        with self._lock:
            docs = self._read()
            filtered = [d for d in docs if d["id"] != doc_id]
            if len(filtered) == len(docs):
                return False
            self._write(filtered)
            return True


# Singleton instance
document_store = DocumentStore()
