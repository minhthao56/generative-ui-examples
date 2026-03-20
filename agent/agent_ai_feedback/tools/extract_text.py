"""Text extraction tool for .docx and .pdf files."""

from __future__ import annotations

from pathlib import Path


def extract_text_from_file(file_path: str) -> str:
    """Extract plain text from a .docx or .pdf file.

    Args:
        file_path: Path to the file on disk.

    Returns:
        Extracted plain text string.

    Raises:
        ValueError: If file type is not supported.
    """
    path = Path(file_path)
    suffix = path.suffix.lower()

    if suffix == ".docx":
        return _extract_from_docx(path)
    elif suffix == ".pdf":
        return _extract_from_pdf(path)
    else:
        raise ValueError(f"Unsupported file type: {suffix}. Only .docx and .pdf are supported.")


def _extract_from_docx(path: Path) -> str:
    """Extract text from a .docx file using python-docx."""
    import docx

    doc = docx.Document(str(path))
    paragraphs = []
    for para in doc.paragraphs:
        text = para.text.strip()
        if text:
            paragraphs.append(text)
    return "\n\n".join(paragraphs)


def _extract_from_pdf(path: Path) -> str:
    """Extract text from a .pdf file using pymupdf."""
    import pymupdf

    doc = pymupdf.open(str(path))
    pages_text = []
    for page in doc:
        text = page.get_text().strip()
        if text:
            pages_text.append(text)
    doc.close()
    return "\n\n".join(pages_text)
