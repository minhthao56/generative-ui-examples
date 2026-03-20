"""Feedback Agent: evaluates document against rubric and generates feedback items."""

import json

from google.adk.agents import Agent
from google.adk.tools import ToolContext

from ..prompts.feedback_prompt import FEEDBACK_AGENT_INSTRUCTION


def set_feedback_results(
    tool_context: ToolContext,
    feedback_items: list[dict],
) -> dict:
    """Store the generated feedback items.

    Args:
        feedback_items: List of feedback objects, each with 'rubric_category', 'excerpt', and 'explanation' keys. Maximum 6 items.
    """
    # Enforce max 6 items
    items = feedback_items[:6]
    tool_context.state["feedback_items"] = items
    return {"status": "success", "count": len(items)}


def create_feedback_agent() -> Agent:
    return Agent(
        name="feedback_agent",
        model="gemini-2.5-flash",
        instruction=FEEDBACK_AGENT_INSTRUCTION,
        description="Evaluates the document against the rubric and generates feedback items.",
        tools=[set_feedback_results],
        output_key="feedback_result",
    )
