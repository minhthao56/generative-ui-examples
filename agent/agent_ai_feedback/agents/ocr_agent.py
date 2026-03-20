"""OCR Agent: extracts text from document, generates title and detects subject."""

from google.adk.agents import Agent
from google.adk.tools import ToolContext

from ..prompts.ocr_prompt import OCR_AGENT_INSTRUCTION


def set_ocr_results(
    tool_context: ToolContext,
    generated_title: str,
    detected_subject: str,
) -> dict:
    """Store the OCR analysis results (title and subject).

    Args:
        generated_title: A concise descriptive title for the document.
        detected_subject: The academic subject detected (e.g., English, Biology).
    """
    tool_context.state["generated_title"] = generated_title
    tool_context.state["detected_subject"] = detected_subject
    return {"status": "success", "title": generated_title, "subject": detected_subject}


def create_ocr_agent() -> Agent:
    return Agent(
        name="ocr_agent",
        model="gemini-2.5-flash",
        instruction=OCR_AGENT_INSTRUCTION,
        description="Analyzes extracted document text to generate a title and detect the subject.",
        tools=[set_ocr_results],
        output_key="ocr_result",
    )
