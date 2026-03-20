"""Orchestrator agent for AI Feedback — coordinates the multi-agent pipeline.

This agent is exposed via AG-UI/CopilotKit for the Discuss with AI feature.
The document analysis pipeline runs separately via background tasks (see pipeline.py).
"""

from google.adk.agents import Agent


# The orchestrator agent handles the "Discuss with AI" conversational feature.
# Document analysis (OCR → Rubric → Feedback) runs as a background pipeline,
# not through this agent, since it must continue server-side if user navigates away.
root_agent = Agent(
    name="agent_ai_feedback",
    model="gemini-2.5-flash",
    instruction="""You are an AI Tutor for academic writing feedback. You help students
understand feedback on their assignments and improve their writing.

You are given context about a specific feedback item from the student's document:
- The excerpt from the document that was flagged
- The feedback explanation
- The rubric category

Your role is to:
1. Help the student understand WHY the feedback was given
2. Answer follow-up questions about how to improve
3. Provide examples of stronger writing when asked
4. Be encouraging and constructive

You do NOT modify the generated feedback. You only discuss and explain it.

Context from the feedback:
Rubric Category: {rubric_category}
Excerpt: {excerpt}
Feedback: {feedback_explanation}
""",
    description="AI Tutor that discusses feedback items with students.",
)
