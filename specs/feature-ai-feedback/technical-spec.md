# Technical Spec: AI Feedback Feature (V1)

**PRD Reference:** [PRD: AI Feedback](https://manabie.atlassian.net/wiki/spaces/PRDM/pages/2361622595/PRD+AI+Feedback)
**Date:** 2026-03-20
**Status:** Draft

---

## 1. Summary

Build a web feature that allows students to upload assignments (.docx, .pdf), receive structured AI-generated feedback based on auto-generated rubrics, and discuss individual feedback items with an AI tutor. The feature is integrated into the existing Next.js + ADK agent architecture.

---

## 2. Architecture Overview

### 2.1 New Route: `/ai-feedback`

A new Next.js app route with three views:

| View | Route | Description |
|------|-------|-------------|
| Home / My Assignments | `/ai-feedback` | Upload area + document card grid |
| Document Detail | `/ai-feedback/[documentId]` | Extracted text viewer + feedback panel |
| Discuss with AI | (panel/drawer on detail page) | Chat scoped to a specific feedback item |

### 2.2 New ADK Agent: `agent_ai_feedback`

A new Python ADK agent mounted at `/adk-ai-feedback-agent` handling:
- Document text extraction
- Rubric generation
- Document evaluation & feedback generation
- Discuss-with-AI conversation

### 2.3 High-Level Data Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────────┐
│  Next.js UI  │────▶│ CopilotKit   │────▶│  ADK Agent          │
│  /ai-feedback│◀────│ Runtime/AG-UI│◀────│  (FastAPI :8000)    │
└─────────────┘     └──────────────┘     └──────┬──────────────┘
                                                 │
                                          ┌──────▼──────────┐
                                          │  Gemini 2.5 Flash│
                                          │  (Google AI)     │
                                          └─────────────────┘
```

---

## 3. Frontend Design

### 3.1 Pages & Components

#### 3.1.1 Home Page — `/ai-feedback/page.tsx`

**Components:**
- `AssignmentUploader` — Drag-and-drop zone accepting `.docx`, `.pdf` (max 20MB)
- `AssignmentCard` — Card showing: file type icon, AI-generated title, subject chip, feedback count, date, loading/error states
- `AssignmentGrid` — Grid layout of `AssignmentCard` components

**Behavior:**
- On file drop/select → upload file → create document record → show card in "Analyzing..." loading state
- Cards link to `/ai-feedback/[documentId]`
- Loading state: skeleton card with "Analyzing your document..." text
- Error state: card with retry button

#### 3.1.2 Document Detail Page — `/ai-feedback/[documentId]/page.tsx`

**Layout:** Two-column split view (responsive)

**Left Panel — `ExtractedTextViewer`:**
- Scrollable rendered text extracted from the document
- No complex formatting preservation needed (plain text with paragraphs/headings)

**Right Panel — `FeedbackPanel`:**
- `FeedbackItem` cards (max 6), each containing:
  - Numbered header with rubric category chip (colored)
  - Quoted excerpt from document (blockquote style, yellow highlight as per mockup)
  - Feedback explanation text
  - "Discuss this with AI" button
- `SubjectChip` — detected subject badge in header

#### 3.1.3 Discuss with AI — `DiscussWithAIPanel`

**Behavior:**
- Opens as a right-side panel/drawer replacing the feedback list (as shown in mockup)
- Back button returns to feedback list
- Header shows "AI TUTOR" + rubric category label (e.g., "Critical Thinking")
- Chat interface with:
  - Initial context message showing the excerpt + feedback
  - Student text input with send button
  - AI response messages
- Context passed to agent: excerpt, feedback explanation, rubric category, full document text

### 3.2 State Management

```typescript
// src/lib/types.ts — additions

interface AIFeedbackDocument {
  id: string;
  fileName: string;
  fileType: "docx" | "pdf";
  title: string;                    // AI-generated
  subject: string;                  // AI-detected
  extractedText: string;
  status: "uploading" | "extracting" | "analyzing" | "complete" | "error";
  feedbackItems: FeedbackItem[];
  createdAt: string;
  errorMessage?: string;
}

interface FeedbackItem {
  id: string;
  rubricCategory: string;
  excerpt: string;
  explanation: string;
}

interface AIFeedbackState {
  documents: AIFeedbackDocument[];
  currentDocumentId: string | null;
}
```

### 3.3 CopilotKit Integration

Register in a new hook `src/hooks/use-ai-feedback.tsx`:

- **Frontend action: `uploadDocument`** — handles file upload, triggers agent pipeline
- **Generative UI component: `feedbackPanel`** — renders the feedback items as structured UI
- **Generative UI component: `discussWithAI`** — renders the AI tutor chat panel

### 3.4 New Dependencies

| Package | Purpose |
|---------|---------|
| `mammoth` | .docx → text extraction (client or server-side) |
| `pdf-parse` / `pdfjs-dist` | .pdf → text extraction |

---

## 4. Backend Design

### 4.1 Agent Structure

```
agent/
├── agent_ai_feedback/
│   ├── __init__.py
│   ├── agent.py              # Main orchestrator agent
│   ├── tools/
│   │   ├── __init__.py
│   │   ├── extract_text.py   # Text extraction tool
│   │   ├── generate_rubric.py # Rubric generation tool
│   │   ├── evaluate_document.py # Feedback generation tool
│   │   └── discuss_feedback.py  # Discussion tool
│   └── prompts/
│       ├── rubric_generator.py
│       └── evaluator.py
```

### 4.2 Agent Pipeline (Two-Step AI)

As specified in the PRD, the pipeline uses two sequential AI steps:

#### Step 1: Rubric Generator

**Input:** Extracted text
**Output:** List of rubric categories (3-6 categories)
**Prompt strategy:** Analyze document type, subject matter, academic level → generate appropriate evaluation rubric

```python
# Rubric output schema
class RubricCategory(BaseModel):
    name: str          # e.g., "Argument Structure"
    description: str   # What this category evaluates

class Rubric(BaseModel):
    categories: list[RubricCategory]  # 3-6 categories
    detected_subject: str              # e.g., "English"
    generated_title: str               # e.g., "The Role of Social Media..."
```

#### Step 2: Evaluation AI

**Input:** Extracted text + Rubric
**Output:** Up to 6 feedback items

```python
# Feedback output schema
class FeedbackItem(BaseModel):
    rubric_category: str   # References a rubric category name
    excerpt: str           # Exact quote from the document
    explanation: str       # Feedback text

class EvaluationResult(BaseModel):
    feedback_items: list[FeedbackItem]  # Max 6
```

### 4.3 Tools

| Tool | Description | Input | Output |
|------|-------------|-------|--------|
| `extract_text` | Extract text from uploaded file bytes | File bytes + type | Plain text string |
| `generate_rubric` | Generate rubric for document | Extracted text | `Rubric` object |
| `evaluate_document` | Evaluate document against rubric | Extracted text + Rubric | `EvaluationResult` |
| `discuss_feedback` | Handle follow-up Q&A on a feedback item | Feedback context + user message | AI response |

### 4.4 Agent Registration in `main.py`

```python
# main.py — additions
from agent_ai_feedback.agent import ai_feedback_agent

# Mount new agent endpoint
app.mount("/adk-ai-feedback-agent", ai_feedback_wrapper)
```

### 4.5 CopilotKit Runtime Route

Update `src/app/api/copilotkit/route.ts` to add a new `HttpAgent` pointing to `http://localhost:8000/adk-ai-feedback-agent`.

---

## 5. Data Storage (V1)

### 5.1 Approach: Local/Session Storage + Agent State

For V1, use a lightweight approach:
- **Uploaded files:** Stored temporarily on the server filesystem (`agent/uploads/`)
- **Document metadata + feedback:** Stored in agent state (in-memory), synced to frontend via CopilotKit state
- **Chat history (Discuss with AI):** Maintained in CopilotKit conversation context per session

### 5.2 Future: Database

V2+ should migrate to a persistent database (e.g., PostgreSQL/Firestore) for:
- Cross-session document history
- Feedback streams with re-upload
- Teacher dashboards

---

## 6. File Upload Flow

```
1. User drops file in upload zone
2. Frontend validates: file type (.docx/.pdf), size (≤20MB)
3. File sent to backend via CopilotKit action → agent tool
4. Backend extracts text (mammoth/pdfparse)
5. If extracted text > token limit → truncate + set truncation notice
6. Agent runs rubric generation (Step 1)
7. Agent runs evaluation (Step 2)
8. Results streamed back to frontend via AG-UI protocol
9. Frontend renders feedback panel
```

---

## 7. Error Handling

| Scenario | Behavior |
|----------|----------|
| Unsupported file type | Frontend validation rejects immediately |
| File > 20MB | Frontend validation rejects with message |
| Text extraction fails | Show error state on card, allow retry |
| Rubric generation fails | Auto-retry once, then show error state |
| Evaluation fails | Auto-retry once, then show error state |
| Text exceeds AI limit | Truncate + show notice: "Only part of your document was used" |

---

## 8. Feature Flag

- Tenant-level flag: `ai_feedback_enabled`
- When disabled:
  - `/ai-feedback` route returns a "Feature not available" message
  - Upload entry point hidden
  - Existing documents remain viewable (read-only)

---

## 9. Auto-Evaluation Metrics (Quality Gates)

Per PRD requirements, the system should be validated against:

| Metric | Target |
|--------|--------|
| Extracted text accuracy | ≥ 97% |
| Excerpt exact match to source document | ≥ 97% |
| Same-document rubric/feedback consistency | ≥ 80% overlap across re-uploads |
| Latency | Not a blocker (3-5 min acceptable) |

---

## 10. Implementation Plan

### Phase 1: Foundation (Week 1)

| # | Task | Details |
|---|------|---------|
| 1.1 | Create route structure | `/ai-feedback` layout, page, `[documentId]` page |
| 1.2 | Build `AssignmentUploader` component | Drag-and-drop with file validation |
| 1.3 | Build `AssignmentCard` component | With loading, error, complete states |
| 1.4 | Build `AssignmentGrid` component | Responsive grid layout |
| 1.5 | Set up `agent_ai_feedback/` backend skeleton | Agent, tools stubs, mount in main.py |
| 1.6 | Implement text extraction tool | .docx (mammoth) + .pdf (pdfparse) |

### Phase 2: AI Pipeline (Week 2)

| # | Task | Details |
|---|------|---------|
| 2.1 | Implement rubric generator prompt + tool | With structured output schema |
| 2.2 | Implement evaluator prompt + tool | Feedback generation with excerpts |
| 2.3 | Wire up two-step pipeline in agent | Sequential: extract → rubric → evaluate |
| 2.4 | Connect frontend upload → agent pipeline | Via CopilotKit action + AG-UI |
| 2.5 | Implement state sync | Agent state → frontend document list |

### Phase 3: Detail View & Feedback UI (Week 3)

| # | Task | Details |
|---|------|---------|
| 3.1 | Build `ExtractedTextViewer` | Scrollable text panel |
| 3.2 | Build `FeedbackPanel` + `FeedbackItem` | Rubric chips, excerpts, explanations |
| 3.3 | Build `SubjectChip` + `RubricChip` | Styled badge components |
| 3.4 | Implement document detail page layout | Two-column responsive split |

### Phase 4: Discuss with AI (Week 4)

| # | Task | Details |
|---|------|---------|
| 4.1 | Build `DiscussWithAIPanel` | Chat UI with context display |
| 4.2 | Implement `discuss_feedback` tool | Contextual Q&A with feedback scope |
| 4.3 | Wire discussion context passing | Excerpt + feedback + rubric + full doc |
| 4.4 | Loading states & error handling | Retry logic, error states, truncation notice |

### Phase 5: Polish & Validation (Week 5)

| # | Task | Details |
|---|------|---------|
| 5.1 | Feature flag implementation | Tenant-level toggle |
| 5.2 | Quality validation against metrics | Excerpt accuracy, consistency tests |
| 5.3 | UI polish | Responsive design, animations, edge cases |
| 5.4 | End-to-end testing | Full flow: upload → feedback → discuss |

---

## 11. Out of Scope (V1)

- Image-based document uploads (OCR)
- Teacher-defined rubrics
- Re-upload / feedback streams
- Revision tracking / version comparison
- Rubric scores (numeric/level-based)
- Teacher dashboard
- Mobile support
- Persistent database storage

---

## 12. Open Questions

1. **Storage for V1:** Is in-memory agent state sufficient, or do we need a lightweight DB (SQLite/JSON file) for persistence across server restarts?
2. **File processing location:** Should text extraction happen client-side (reducing server load) or server-side (simpler architecture)?
3. **Concurrent uploads:** Should we support multiple simultaneous uploads, or queue them?
4. **Authentication:** How does tenant-level feature flag integrate with the existing auth system?
5. **Token budget:** What's the max token limit for document text sent to Gemini, and how should truncation be communicated in the extracted text viewer?
