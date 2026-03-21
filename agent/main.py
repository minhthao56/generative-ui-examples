"""Shared State feature."""

from __future__ import annotations

import os

from ag_ui_adk import ADKAgent, add_adk_fastapi_endpoint
from dotenv import load_dotenv
from fastapi import FastAPI
from google.adk.cli.fast_api import get_fast_api_app
from agent_proverbs import root_agent as proverbs_agent
from agent_generative_ui import root_agent as generative_ui_agent
from agent_ai_feedback import root_agent as ai_feedback_agent
from agent_ai_feedback.routes import router as ai_feedback_router
from agent_discuss import root_agent as discuss_agent

load_dotenv()



# Create ADK middleware agent instance
adk_proverbs_agent = ADKAgent(
    adk_agent=proverbs_agent,
    user_id="demo_user",
    session_timeout_seconds=3600,
    use_in_memory_services=True,
)
adk_generative_ui_agent = ADKAgent(
    adk_agent=generative_ui_agent,
    user_id="demo_user",
    session_timeout_seconds=3600,
    use_in_memory_services=True,
)
adk_ai_feedback_agent = ADKAgent(
    adk_agent=ai_feedback_agent,
    user_id="demo_user",
    session_timeout_seconds=3600,
    use_in_memory_services=True,
)
adk_discuss_agent = ADKAgent(
    adk_agent=discuss_agent,
    user_id="demo_user",
    session_timeout_seconds=3600,
    use_in_memory_services=True,
)


AGENT_DIR = os.path.dirname(os.path.abspath(__file__))
ALLOWED_ORIGINS = ["http://localhost", "http://localhost:8080", "*"]
SERVE_WEB_INTERFACE = True
# Create FastAPI app
app: FastAPI = get_fast_api_app(
    agents_dir=AGENT_DIR,
    allow_origins=ALLOWED_ORIGINS,
    web=SERVE_WEB_INTERFACE,
)
# Add the ADK endpoint
add_adk_fastapi_endpoint(app, adk_proverbs_agent, path="/adk-proverbs-agent")
add_adk_fastapi_endpoint(app, adk_generative_ui_agent, path="/adk-generative-ui-agent")
add_adk_fastapi_endpoint(app, adk_ai_feedback_agent, path="/adk-ai-feedback-agent")
add_adk_fastapi_endpoint(app, adk_discuss_agent, path="/adk-discuss-agent")

# Mount AI Feedback REST routes (document upload, list, status polling)
app.include_router(ai_feedback_router)

if __name__ == "__main__":
    import uvicorn

    if not os.getenv("GOOGLE_API_KEY"):
        print("⚠️  Warning: GOOGLE_API_KEY environment variable not set!")
        print("   Set it with: export GOOGLE_API_KEY='your-key-here'")
        print("   Get a key from: https://makersuite.google.com/app/apikey")
        print()

    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
