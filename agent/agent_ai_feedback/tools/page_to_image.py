"""Page-to-Image tool: convert document pages to PNG images.

For PDF: renders pages directly via pymupdf.
For DOCX: pymupdf can open docx files natively and render pages.

Returns a list of PNG image bytes (one per page).
"""

from __future__ import annotations

import logging
from pathlib import Path

import pymupdf

logger = logging.getLogger(__name__)

MAX_PAGES = 10  # Limit to first N pages to avoid excessive processing
DPI = 150  # Resolution for page rendering


def document_to_images(file_path: str) -> list[bytes]:
    """Convert document pages to PNG image bytes.

    Args:
        file_path: Path to the document file (.pdf or .docx).

    Returns:
        List of PNG image bytes, one per page (up to MAX_PAGES).
    """
    path = Path(file_path)
    suffix = path.suffix.lower()

    if suffix == ".pdf":
        return _pdf_to_images(path)
    elif suffix == ".docx":
        return _docx_to_images(path)
    else:
        logger.warning(f"Unsupported file type for page-to-image: {suffix}")
        return []


def _pdf_to_images(path: Path) -> list[bytes]:
    """Render PDF pages to PNG images."""
    doc = pymupdf.open(str(path))
    images = []
    for i, page in enumerate(doc):
        if i >= MAX_PAGES:
            break
        # Render page at specified DPI
        zoom = DPI / 72  # 72 is the default PDF DPI
        mat = pymupdf.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat)
        images.append(pix.tobytes("png"))
    doc.close()
    logger.info(f"Rendered {len(images)} pages from PDF: {path.name}")
    return images


def _docx_to_images(path: Path) -> list[bytes]:
    """Convert DOCX to images via pymupdf.

    pymupdf can open DOCX files and render them. If this fails,
    we return an empty list (text-only fallback).
    """
    try:
        doc = pymupdf.open(str(path))
        images = []
        for i, page in enumerate(doc):
            if i >= MAX_PAGES:
                break
            zoom = DPI / 72
            mat = pymupdf.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=mat)
            images.append(pix.tobytes("png"))
        doc.close()
        logger.info(f"Rendered {len(images)} pages from DOCX: {path.name}")
        return images
    except Exception as e:
        logger.warning(f"Failed to render DOCX as images: {e}. Using text-only fallback.")
        return []
