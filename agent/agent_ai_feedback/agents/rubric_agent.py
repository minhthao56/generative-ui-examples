"""Rubric Agent: generates evaluation rubric categories for the document."""

import json

from google.adk.agents import Agent
from google.adk.tools import ToolContext

from ..prompts.rubric_prompt import RUBRIC_AGENT_INSTRUCTION


def set_rubric_results(
    tool_context: ToolContext,
    categories: list[dict],
) -> dict:
    """Store the generated rubric categories.

    Args:
        categories: List of rubric category objects, each with 'name' and 'description' keys.
    """
    tool_context.state["rubric_categories"] = categories
    return {"status": "success", "count": len(categories)}


def create_rubric_agent() -> Agent:
    return Agent(
        name="rubric_agent",
        model="gemini-2.5-flash",
        instruction=RUBRIC_AGENT_INSTRUCTION,
        description="Generates rubric categories for evaluating the document.",
        tools=[set_rubric_results],
        output_key="rubric_result",
    )
