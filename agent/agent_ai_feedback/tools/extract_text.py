"""Text extraction tool for .docx and .pdf files — outputs Markdown."""

from __future__ import annotations

from pathlib import Path


def extract_text_from_file(file_path: str) -> str:
    """Extract text from a .docx or .pdf file and return it as Markdown.

    Args:
        file_path: Path to the file on disk.

    Returns:
        Extracted text as a Markdown string.

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
    """Extract Markdown from a .docx file using python-docx paragraph styles."""
    import docx

    doc = docx.Document(str(path))
    lines: list[str] = []

    for para in doc.paragraphs:
        text = para.text.strip()
        if not text:
            continue

        style_name = (para.style.name or "").lower() if para.style else ""

        if "heading 1" in style_name or "title" in style_name:
            lines.append(f"# {text}")
        elif "heading 2" in style_name:
            lines.append(f"## {text}")
        elif "heading 3" in style_name:
            lines.append(f"### {text}")
        elif "heading 4" in style_name:
            lines.append(f"#### {text}")
        elif "list" in style_name:
            lines.append(f"- {text}")
        else:
            # Apply inline bold / italic from runs
            lines.append(_runs_to_markdown(para.runs, text))

        lines.append("")  # blank line between paragraphs

    return "\n".join(lines).strip()


def _runs_to_markdown(runs, fallback: str) -> str:
    """Convert paragraph runs to Markdown with bold/italic spans."""
    if not runs:
        return fallback

    parts: list[str] = []
    for run in runs:
        t = run.text
        if not t:
            continue
        if run.bold and run.italic:
            parts.append(f"***{t}***")
        elif run.bold:
            parts.append(f"**{t}**")
        elif run.italic:
            parts.append(f"*{t}*")
        else:
            parts.append(t)

    result = "".join(parts).strip()
    return result if result else fallback


def _extract_from_pdf(path: Path) -> str:
    """Extract Markdown from a .pdf file using pymupdf.

    Uses font-size heuristics to detect headings.
    """
    import pymupdf

    doc = pymupdf.open(str(path))
    lines: list[str] = []

    for page_idx, page in enumerate(doc):
        blocks = page.get_text("dict", flags=pymupdf.TEXT_PRESERVE_WHITESPACE)["blocks"]

        for block in blocks:
            if block.get("type") != 0:  # text blocks only
                continue

            for line_data in block.get("lines", []):
                spans = line_data.get("spans", [])
                if not spans:
                    continue

                text = "".join(s["text"] for s in spans).strip()
                if not text:
                    continue

                # Use the largest span's font size as representative
                max_size = max(s.get("size", 12) for s in spans)
                is_bold = any("bold" in s.get("font", "").lower() for s in spans)

                if max_size >= 18:
                    lines.append(f"# {text}")
                elif max_size >= 15:
                    lines.append(f"## {text}")
                elif max_size >= 13 and is_bold:
                    lines.append(f"### {text}")
                elif is_bold:
                    lines.append(f"**{text}**")
                else:
                    lines.append(text)

            lines.append("")  # blank line between blocks

        # Page separator
        if page_idx < len(doc) - 1:
            lines.append("---")
            lines.append("")

    doc.close()
    return "\n".join(lines).strip()
