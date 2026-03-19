# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A generative UI demo combining Google ADK (Agent Development Kit) Python agents with a Next.js + CopilotKit frontend. The app showcases two example pages: a generative UI chat (`/generative-ui`) and a headless agent interaction (`/headless`).

## Commands

```bash
bun install                # Install JS dependencies (also runs install:agent via postinstall)
bun run install:agent      # Install Python agent dependencies (runs scripts/setup-agent.sh → uv sync)
bun run dev                # Start both UI (Next.js on :3000) and agent (FastAPI on :8000) concurrently
bun run dev:ui             # Start only the Next.js UI server (with Turbopack)
bun run dev:agent          # Start only the ADK agent server
bun run build              # Production build (Next.js)
bun run lint               # ESLint
```

Requires `GOOGLE_API_KEY` env var set (Google Makersuite API key).

## Architecture

### Two-process setup
- **Frontend**: Next.js 16 app (React 19, Tailwind v4, TypeScript) on port 3000
- **Backend**: FastAPI/uvicorn Python server on port 8000, running Google ADK agents

### Frontend → Backend connection
1. CopilotKit runtime at `src/app/api/copilotkit/route.ts` creates an AG-UI `HttpAgent` pointing to `http://localhost:8000/adk-generative-ui-agent`
2. The `/generative-ui` layout wraps children in `<CopilotKit runtimeUrl="/api/copilotkit" agent="my_agent">`
3. Frontend tools and generative UI components are registered in `src/hooks/use-generative-ui-examples.tsx` using CopilotKit hooks (`useComponent`, `useFrontendTool`, `useHumanInTheLoop`)

### Agent structure (`agent/`)
- `main.py` — FastAPI app entry point; creates ADK agent wrappers and mounts endpoints at `/adk-proverbs-agent` and `/adk-generative-ui-agent`
- `agent_proverbs/` — LlmAgent with shared state (proverbs list), callbacks for state injection into prompts, tools: `set_proverbs`, `get_weather`
- `agent_generative_ui/` — Agent using SkillToolset with `extraordinary-responses-skill`, plus custom tools (`QueryDataTool`, `GenerateFormTool`). Uses `db.csv` for sample data
- `agent_weather/` — Weather agent (unused in main.py currently)
- Python deps managed with `uv` (`pyproject.toml` + `uv.lock`), venv at `agent/.venv/`

### Generative UI pattern
The agent produces tool calls that the frontend renders as React components:
- **Controlled components**: `pieChart`, `barChart` — structured data rendered via recharts
- **Widget renderer**: `widgetRenderer` — agent generates raw HTML/CSS/JS rendered in a sandboxed iframe with theme CSS variables, auto-resize, and bridge functions (`sendPrompt`, `openLink`)
- **Human-in-the-loop**: `scheduleTime` — meeting time picker requiring user interaction
- **Frontend tool**: `toggleTheme` — theme switching without backend round-trip

### Key conventions
- CopilotKit v2 APIs used throughout (`@copilotkit/react-core/v2`)
- AG-UI protocol (`@ag-ui/client`, `ag-ui-adk`) bridges ADK agents to CopilotKit
- Agent state type defined in `src/lib/types.ts` — must stay in sync with Python agent state
- ADK agents use `gemini-2.5-flash` model
