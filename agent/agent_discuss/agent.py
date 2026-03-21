"""Discuss agent — AI Tutor for discussing feedback items with students.

Uses before_model_callback to inject feedback context from shared state
into the system prompt. Frontend passes context via useAgent shared state.
"""

from __future__ import annotations

from typing import Optional

from google.adk.agents import LlmAgent
from google.adk.agents.callback_context import CallbackContext
from google.adk.models.llm_request import LlmRequest
from google.adk.models.llm_response import LlmResponse
from google.genai import types


def on_before_agent(callback_context: CallbackContext):
    """Initialize discuss state if keys don't exist yet."""
    state = callback_context.state
    if state.get("rubric_category", None) is None:
        state["rubric_category"] = ""
        state["excerpt"] = ""
        state["feedback_explanation"] = ""
        state["document_text"] = ""
    return None


def before_model_callback(
    callback_context: CallbackContext,
    llm_request: LlmRequest,
) -> Optional[LlmResponse]:
    """Inject feedback context from shared state into the system prompt."""
    state = callback_context.state

    rubric_category = state.get("rubric_category", "") or ""
    excerpt = state.get("excerpt", "") or ""
    feedback_explanation = state.get("feedback_explanation", "") or ""
    document_text = state.get("document_text", "") or ""

    # Build context block
    context_parts = []
    if rubric_category:
        context_parts.append(f"Rubric Category: {rubric_category}")
    if excerpt:
        context_parts.append(f'Excerpt from student document: "{excerpt}"')
    if feedback_explanation:
        context_parts.append(f"Feedback explanation: {feedback_explanation}")
    if document_text:
        context_parts.append(f"Full document text:\n{document_text}")

    context_block = (
        "\n".join(context_parts)
        if context_parts
        else "No feedback context available yet."
    )

    prefix = f"""You are an AI Tutor for academic writing feedback.
The student wants to discuss this specific feedback item:

{context_block}

Guidelines:
- Help the student understand the feedback and improve their writing.
- When the student asks for an example or how to improve, provide a CONCRETE rewritten version of their excerpt that applies the feedback. Show them exactly what the improved text looks like, then briefly explain what changed and why.
- Be encouraging and constructive.
- Keep responses concise (2-4 paragraphs).
- Do NOT change the feedback itself — but DO show improved versions of the student's writing when asked.
- Reference specific parts of the excerpt when explaining.
"""

    # Inject into llm_request.config.system_instruction
    original_si = llm_request.config.system_instruction or types.Content(
        role="system", parts=[]
    )
    if not isinstance(original_si, types.Content):
        original_si = types.Content(
            role="system",
            parts=[types.Part(text=str(original_si))],
        )
    if not original_si.parts:
        original_si.parts.append(types.Part(text=""))

    original_si.parts[0].text = prefix + (original_si.parts[0].text or "")
    llm_request.config.system_instruction = original_si

    # Debug: print final system instruction sent to model
    final_text = original_si.parts[0].text if original_si.parts else "<empty>"
    print("=" * 60)
    print("FINAL SYSTEM INSTRUCTION SENT TO MODEL:")
    print("=" * 60)
    print(final_text[:2000])
    if len(final_text) > 2000:
        print(f"... (truncated, total length: {len(final_text)})")
    print("=" * 60)

    return None


root_agent = LlmAgent(
    name="agent_discuss",
    model="gemini-2.5-flash",
    instruction=(
        "You are an AI Tutor for academic writing feedback. "
        "Help students understand feedback and improve their writing. "
        "Be encouraging, constructive, and Socratic. "
        "Keep responses concise (2-4 paragraphs). "
        "Do NOT modify the generated feedback. Only discuss and explain it. "
        "Reference specific parts of the excerpt when explaining."
    ),
    description="AI Tutor that discusses feedback items with students.",
    before_agent_callback=on_before_agent,
    before_model_callback=before_model_callback,
)
