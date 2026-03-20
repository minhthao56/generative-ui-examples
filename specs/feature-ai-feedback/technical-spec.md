# Technical Spec: AI Feedback Feature (V1)

**PRD Reference:** [PRD: AI Feedback](https://manabie.atlassian.net/wiki/spaces/PRDM/pages/2361622595/PRD+AI+Feedback)
**Date:** 2026-03-20
**Status:** Draft

---

## 1. Summary

Build a web feature that allows students to upload assignments (.docx, .pdf), receive structured AI-generated feedback based on auto-generated rubrics, and discuss individual feedback items with an AI tutor. The feature is integrated into the existing Next.js + ADK agent architecture.

### Key PRD Constraints (V1)

- **Supported formats:** .docx, .pdf only (no images)
- **Max upload size:** 20 MB
- **Max feedback items:** 6 per document
- **Duplicate uploads:** Each upload treated as a separate analysis (no dedup)
- **Background processing:** Analysis must continue server-side if user navigates away or closes browser tab
- **Rubric strategy:** Fresh rubric generated per upload (no teacher-defined rubrics in V1)
- **Discuss with AI:** Read-only — conversations do NOT modify generated feedback
- **AI inputs:** Both extracted text AND original document as images are passed to Rubric + Feedback agents
- **Truncation:** If text exceeds AI processing limit, truncate and show gentle notice to user

---

## 2. Architecture Overview

### 2.1 New Route: `/ai-feedback`

A new Next.js app route with three views:

| View | Route | Description |
|------|-------|-------------|
| Home / My Assignments | `/ai-feedback` | Upload area + document card grid |
| Document Detail | `/ai-feedback/[documentId]` | Extracted text viewer + feedback panel |
| Discuss with AI | (panel/drawer on detail page) | Chat scoped to a specific feedback item |

### 2.2 New ADK Agents (Multi-Agent Pipeline)

Based on the [pipeline diagram](./diagram-ai-feedback-flow.png), the backend uses **3 specialized agents** running sequentially with parallel sub-steps:

| Agent | Mounted At | Input | Output |
|-------|-----------|-------|--------|
| **OCR Agent** | (internal sub-agent) | Document file | Extracted text, title, subject |
| **Rubric Agent** | (internal sub-agent) | Extracted text, document images, title, subject | Rubric categories |
| **Feedback Agent** | (internal sub-agent) | Extracted text, document images, rubric categories, title, subject | Feedback items (max 6) |

An orchestrator agent at `/adk-ai-feedback-agent` coordinates the pipeline.

### 2.3 High-Level Data Flow

```
┌─────────────┐     ┌──────────────┐     ┌──────────────────────────────────┐
│  Next.js UI  │────▶│ CopilotKit   │────▶│  ADK Orchestrator Agent          │
│  /ai-feedback│◀────│ Runtime/AG-UI│◀────│  (FastAPI :8000)                 │
└─────────────┘     └──────────────┘     └──────┬───────────────────────────┘
                                                 │
                              ┌───────────────────┼───────────────────┐
                              ▼                   ▼                   │
                     ┌─────────────┐    ┌──────────────────┐          │
                     │  OCR Agent  │    │ Page-to-Image    │          │
                     │  → text,    │    │ → doc pages as   │          │
                     │    title,   │    │   images         │          │
                     │    subject  │    │ (bypass for PDF) │          │
                     └──────┬──────┘    └────────┬─────────┘          │
                            │                    │                    │
                            └────────┬───────────┘                    │
                                     ▼                                │
                            ┌─────────────────┐                       │
                            │  Rubric Agent   │                       │
                            │  → rubric       │                       │
                            │    categories   │                       │
                            └────────┬────────┘                       │
                                     ▼                                │
                            ┌─────────────────┐                       │
                            │ Feedback Agent  │                       │
                            │ → feedback      │                       │
                            │   items (max 6) │                       │
                            └────────┬────────┘                       │
                                     ▼                                │
                              Gemini 2.5 Flash ◀──────────────────────┘
```

**Note:** Page-to-Image may be bypassed for PDFs (which can render pages directly). For .docx, pages are converted to images first.

---

## 3. Frontend Design

### 3.1 Pages & Components

#### 3.1.1 Home Page — `/ai-feedback/page.tsx`

**Components:**
- `AssignmentUploader` — Drag-and-drop zone accepting `.docx`, `.pdf` (max 20MB)
- `AssignmentCard` — Card showing: file type icon, AI-generated title, subject chip, feedback count, date, loading/error states
- `AssignmentGrid` — Grid layout of `AssignmentCard` components

**Behavior:**
- On file drop/select → validate (type + size ≤20MB) → upload file → create document record → show card in "Analyzing your document..." loading state
- Uploading the same document multiple times creates separate analyses (no dedup)
- Cards link to `/ai-feedback/[documentId]`
- Loading state: card with "Analyzing your document..." text + skeleton
- Error state: card with error message + retry button
- When user returns after navigating away, card shows latest state (complete/loading/error)

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
- **Read-only constraint:** Conversations with AI do NOT modify the generated feedback items. The discussion is purely for understanding — no writes back to feedback state.

#### 3.1.4 Truncation Notice — `TruncationBanner`

When `document.isTruncated` is true, display a gentle notice above the feedback panel:

> "Only part of your document was used to generate feedback due to length limits."

Styled as an info banner (not error), dismissible.

### 3.2 State Management

```typescript
// src/lib/types.ts — additions

interface RubricCategory {
  name: string;         // e.g., "Argument Structure"
  description: string;  // What this category evaluates
}

interface AIFeedbackDocument {
  id: string;
  fileName: string;
  fileType: "docx" | "pdf";
  title: string;                    // AI-generated
  subject: string;                  // AI-detected
  extractedText: string;
  rubricCategories: RubricCategory[];  // Stored rubric for this document
  status: "uploading" | "extracting" | "analyzing" | "complete" | "error";
  feedbackItems: FeedbackItem[];
  createdAt: string;
  errorMessage?: string;
  isTruncated?: boolean;           // True if text was truncated for AI processing
}

interface FeedbackItem {
  id: string;
  documentTitle: string;   // AI-generated document title (per PRD output spec)
  rubricCategory: string;  // References a RubricCategory.name
  excerpt: string;         // Exact quote from the document
  explanation: string;     // Feedback text
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

### 3.4 UI Library

**shadcn/ui** (already initialized — v4, base-nova style, Tailwind v4 CSS variables, lucide icons).

Existing: `Button`. To add: `Card`, `Badge`, `Input`, `Textarea`, `ScrollArea`, `Separator`, `Avatar`, `Skeleton`.

### 3.5 New Backend Dependencies (Python)

| Package | Purpose |
|---------|---------|
| `python-docx` or `mammoth` | .docx → text extraction (OCR Agent) |
| `pymupdf` / `pdfplumber` | .pdf → text extraction + page-to-image |

---

## 4. Backend Design

### 4.1 Agent Structure (Multi-Agent Pipeline)

```
agent/
├── agent_ai_feedback/
│   ├── __init__.py
│   ├── orchestrator.py           # Orchestrator agent — coordinates pipeline
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── ocr_agent.py          # OCR Agent: document → text, title, subject
│   │   ├── rubric_agent.py       # Rubric Agent: text + images → rubric categories
│   │   └── feedback_agent.py     # Feedback Agent: text + images + rubric → feedback items
│   ├── tools/
│   │   ├── __init__.py
│   │   ├── extract_text.py       # Text extraction from .docx/.pdf
│   │   ├── page_to_image.py      # Convert document pages to images
│   │   └── discuss_feedback.py   # Discussion tool for follow-up Q&A
│   └── prompts/
│       ├── ocr_prompt.py
│       ├── rubric_prompt.py
│       └── feedback_prompt.py
```

### 4.2 Agent Pipeline (Three-Agent Sequential with Parallel Sub-Steps)

Per the [pipeline diagram](./diagram-ai-feedback-flow.png):

#### Parallel Step: OCR Agent + Page-to-Image

**OCR Agent:**
- **Input:** Document file
- **Output:** Extracted text, AI-generated title, detected subject

**Page-to-Image (tool, not agent):**
- **Input:** Document file
- **Output:** Document pages as images
- **Note:** May be bypassed for PDFs (native page rendering). For .docx, convert to images.

```python
# OCR output schema
class OCRResult(BaseModel):
    extracted_text: str
    generated_title: str    # e.g., "The Role of Social Media in Modern Democracy"
    detected_subject: str   # e.g., "English"
```

#### Step 2: Rubric Agent

**Input:** Extracted text, document images, document title, subject
**Output:** Rubric categories (3-6)

```python
class RubricCategory(BaseModel):
    name: str          # e.g., "Argument Structure"
    description: str   # What this category evaluates

class RubricResult(BaseModel):
    categories: list[RubricCategory]  # 3-6 categories
```

#### Step 3: Feedback Agent

**Input:** Extracted text, document images, rubric categories, document title, subject
**Output:** Up to 6 feedback items

```python
class FeedbackItem(BaseModel):
    rubric_category: str   # References a rubric category name
    excerpt: str           # Exact quote from the document
    explanation: str       # Feedback text

class FeedbackResult(BaseModel):
    feedback_items: list[FeedbackItem]  # Max 6
```

### 4.3 Discuss with AI (Separate Conversation Agent)

Not part of the pipeline — a standalone conversational agent scoped to a feedback item:
- **Context:** excerpt + feedback explanation + rubric category + full document
- **Behavior:** Multi-turn Q&A, does not modify generated feedback
- **Read-only enforcement:** The discussion agent has NO tools to write back to the document or feedback store. It can only read context and generate conversational responses. This is enforced architecturally (no write tools provided), not just by prompt instruction.
- **Example student questions:** "How can I improve this paragraph?", "Can you show an example of a stronger argument?", "Why is this weak evidence?"

### 4.4 Agent Registration in `main.py`

```python
# main.py — additions
from agent_ai_feedback.orchestrator import ai_feedback_orchestrator

# Mount new agent endpoint
app.mount("/adk-ai-feedback-agent", ai_feedback_wrapper)
```

### 4.5 CopilotKit Runtime Route

Update `src/app/api/copilotkit/route.ts` to add a new `HttpAgent` pointing to `http://localhost:8000/adk-ai-feedback-agent`.

---

## 5. Background Processing & Persistence

### 5.1 Server-Side Job Processing (Critical PRD Requirement)

The PRD requires:
> "AI analysis continues in the background if the student navigates away from the page."
> "If the browser tab is closed, analysis continues server-side."
> "When the student returns, the document tile displays the latest state."

This means the AI pipeline **cannot** rely solely on a live WebSocket/AG-UI connection. The backend must:

1. **Accept upload → create a job record** with status `processing`
2. **Run the 3-agent pipeline asynchronously** (not tied to the request lifecycle)
3. **Store results persistently** so the frontend can poll/fetch on return
4. **Frontend polls or reconnects** to get the latest state

#### Architecture Options

| Option | Pros | Cons |
|--------|------|------|
| **A: FastAPI background tasks + SQLite/JSON file store** | Simple, no extra infra | Not production-grade, single-process |
| **B: Task queue (Celery/Redis or asyncio task)** | Scalable, resilient | More infrastructure |
| **C: Agent state persistence via CopilotKit + polling endpoint** | Fits existing stack | CopilotKit may not support detached runs |

**Recommended for V1:** Option A — FastAPI `BackgroundTasks` with a lightweight JSON file store (`agent/data/documents.json`). The frontend uses a REST polling endpoint (`GET /api/documents/{id}/status`) in addition to the AG-UI streaming connection.

### 5.2 Data Storage

| Data | Storage (V1) | Notes |
|------|-------------|-------|
| Uploaded files | Server filesystem (`agent/uploads/`) | Cleaned up after processing |
| Document metadata + feedback | JSON file store (`agent/data/`) | Persists across server restarts |
| Rubric categories | Stored with document record | Referenced by feedback items |
| Document page images | Temp files during pipeline | Discarded after feedback generated |
| Chat history (Discuss with AI) | CopilotKit conversation context | Session-scoped, not persisted |

### 5.3 Future: Database

V2+ should migrate to a persistent database (e.g., PostgreSQL/Firestore) for:
- Cross-session document history
- Feedback streams with re-upload
- Teacher dashboards

---

## 6. File Upload Flow

```
 1. User drops file in upload zone
 2. Frontend validates: file type (.docx/.pdf), size (≤20MB)
 3. Frontend sends file to backend upload endpoint
 4. Backend creates document record (status: "extracting"), returns document ID
 5. Frontend shows card with "Analyzing your document..." loading state
 6. Backend runs pipeline asynchronously (background task):
    a. PARALLEL:
       - OCR Agent: extract text + generate title + detect subject
       - Page-to-Image tool: convert document pages to images (bypass for PDF)
    b. If extracted text > token limit → truncate + set isTruncated flag
    c. Rubric Agent: generate rubric categories (input: text + images + title + subject)
    d. Feedback Agent: generate feedback items (input: text + images + rubric + title + subject)
    e. Store results in document record (status: "complete")
 7. Frontend polls for status OR receives update via AG-UI stream
 8. On complete: frontend renders feedback panel
 9. If any step fails: auto-retry once → if still fails, set status: "error"
10. User can navigate away at any point; pipeline continues server-side
```

### 6.1 Truncation Notice

When `isTruncated` is true, the detail page shows a gentle notice above the feedback panel:

> "Only part of your document was used to generate feedback due to length limits."

---

## 7. Backend REST Endpoints (Supplementary)

In addition to the AG-UI/CopilotKit streaming connection, the backend exposes REST endpoints for file upload and status polling (needed for background processing):

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/documents/upload` | Upload file, returns `{ documentId, status }` |
| `GET` | `/api/documents` | List all documents for current session |
| `GET` | `/api/documents/{id}` | Get document detail + feedback (poll for status) |
| `POST` | `/api/documents/{id}/retry` | Retry failed analysis |

---

## 8. Error Handling

| Scenario | Behavior |
|----------|----------|
| Unsupported file type | Frontend validation rejects immediately |
| File > 20MB | Frontend validation rejects with message |
| Text extraction fails | Show error state on card, allow retry |
| Rubric generation fails | Auto-retry once, then show error state |
| Evaluation fails | Auto-retry once, then show error state |
| Any pipeline stage fails | Document marked as "error", user sees error state |
| Text exceeds AI limit | Truncate + show gentle notice: "Only part of your document was used to generate feedback" |
| User navigates away during analysis | Pipeline continues server-side; card shows latest state on return |

---

## 9. Feature Flag

- Tenant-level flag: `ai_feedback_enabled`
- When disabled:
  - `/ai-feedback` route returns a "Feature not available" message
  - Upload entry point hidden
  - Existing documents remain viewable (read-only)

---

## 10. Auto-Evaluation Metrics (Quality Gates)

Per PRD requirements, the system should be validated against:

| Metric | Target |
|--------|--------|
| Extracted text accuracy | ≥ 97% |
| Excerpt exact match to source document | ≥ 97% |
| Same-document rubric/feedback consistency | ≥ 80% overlap across re-uploads |
| Latency | Not a blocker (3-5 min acceptable) |

---

## 11. Implementation Plan

### Prerequisites

- **shadcn/ui** is already initialized (v4, base-nova style, Tailwind v4 CSS variables, lucide icons)
- Existing shadcn components: `Button`
- `cn()` utility at `src/lib/utils.ts`

### Phase 0: UI Init with shadcn (Current Focus)

Install required shadcn components and scaffold all pages/components with mock data. No backend wiring — pure static UI matching the mockups.

#### 0.1 Install shadcn Components

```bash
bunx shadcn@latest add card badge input scroll-area separator avatar skeleton textarea
```

| shadcn Component | Used For |
|-----------------|----------|
| `Card` | AssignmentCard, FeedbackItem cards |
| `Badge` | Subject chip, rubric category chip, file type badge |
| `Input` | Chat message input |
| `Textarea` | Chat message input (multiline) |
| `ScrollArea` | Extracted text viewer, feedback list, chat messages |
| `Separator` | Visual dividers |
| `Avatar` | User avatar in header, AI tutor avatar |
| `Skeleton` | Loading states for cards and feedback |

#### 0.2 Create Route Structure

| File | Purpose |
|------|---------|
| `src/app/ai-feedback/layout.tsx` | Layout with header (logo, user avatar) |
| `src/app/ai-feedback/page.tsx` | Home page — upload + assignment grid |
| `src/app/ai-feedback/[documentId]/page.tsx` | Detail page — text viewer + feedback panel |

#### 0.3 Build Components (with Mock Data)

| # | Component | File | shadcn Used | Mockup Reference |
|---|-----------|------|-------------|-----------------|
| 0.3.1 | `AIFeedbackHeader` | `src/components/ai-feedback/header.tsx` | Avatar | Top nav bar: "AI Feedback" logo + user info |
| 0.3.2 | `AssignmentUploader` | `src/components/ai-feedback/assignment-uploader.tsx` | Card | Drag-and-drop zone with dashed border |
| 0.3.3 | `AssignmentCard` | `src/components/ai-feedback/assignment-card.tsx` | Card, Badge, Skeleton | Doc card: file type badge, title, subject chip, feedback count, date |
| 0.3.4 | `AssignmentGrid` | `src/components/ai-feedback/assignment-grid.tsx` | — | 2-column responsive grid of cards |
| 0.3.5 | `ExtractedTextViewer` | `src/components/ai-feedback/extracted-text-viewer.tsx` | Card, ScrollArea | Left panel: scrollable document text |
| 0.3.6 | `FeedbackPanel` | `src/components/ai-feedback/feedback-panel.tsx` | ScrollArea | Right panel: list of feedback items |
| 0.3.7 | `FeedbackItem` | `src/components/ai-feedback/feedback-item.tsx` | Card, Badge, Separator | Numbered card: rubric chip, excerpt (yellow quote), explanation, "Discuss" button |
| 0.3.8 | `DiscussWithAIPanel` | `src/components/ai-feedback/discuss-with-ai-panel.tsx` | Card, ScrollArea, Textarea, Avatar | Chat panel: AI tutor header, messages, input |
| 0.3.9 | `SubjectChip` | `src/components/ai-feedback/subject-chip.tsx` | Badge | Colored subject badge (English, Science, etc.) |
| 0.3.10 | `FileTypeBadge` | `src/components/ai-feedback/file-type-badge.tsx` | Badge | DOCX/PDF icon badge |

#### 0.4 Mock Data

Create `src/components/ai-feedback/mock-data.ts` with sample documents and feedback items matching the mockup content (Social Media essay, Photosynthesis lab report).

#### 0.5 Task Checklist

- [ ] Install shadcn components (`card`, `badge`, `input`, `scroll-area`, `separator`, `avatar`, `skeleton`, `textarea`)
- [ ] Create `/ai-feedback` route layout with header
- [ ] Build `AssignmentUploader` — drag-and-drop zone (UI only, no upload logic)
- [ ] Build `AssignmentCard` — complete, loading, error states
- [ ] Build home page with `AssignmentGrid` + mock cards
- [ ] Build `ExtractedTextViewer` — left panel with mock document text
- [ ] Build `FeedbackPanel` + `FeedbackItem` — right panel with mock feedback
- [ ] Build `DiscussWithAIPanel` — chat UI with mock messages
- [ ] Build detail page with two-column layout
- [ ] Wire client-side navigation between home → detail → discuss
- [ ] Responsive design (mobile: stack columns)

---

### Phase 1: Backend Foundation & Upload (Week 2)

| # | Task | Details |
|---|------|---------|
| 1.1 | Set up `agent_ai_feedback/` structure | Orchestrator + 3 sub-agents + tools |
| 1.2 | Implement REST upload endpoint | `POST /api/documents/upload` — accept file, create record, return ID |
| 1.3 | Implement JSON file store | `agent/data/documents.json` for persistent document records |
| 1.4 | Implement background task runner | FastAPI `BackgroundTasks` for async pipeline execution |
| 1.5 | Implement status polling endpoint | `GET /api/documents/{id}` for frontend polling |
| 1.6 | Mount orchestrator in `main.py` | `/adk-ai-feedback-agent` endpoint |

### Phase 2: AI Pipeline Agents (Week 3)

| # | Task | Details |
|---|------|---------|
| 2.1 | Implement OCR Agent | Text extraction + title generation + subject detection |
| 2.2 | Implement Page-to-Image tool | .docx → images, PDF page rendering bypass |
| 2.3 | Implement Rubric Agent | Input: text + images + title + subject → rubric categories |
| 2.4 | Implement Feedback Agent | Input: text + images + rubric + title + subject → feedback items (max 6) |
| 2.5 | Wire orchestrator pipeline | Parallel (OCR + Page-to-Image) → Rubric → Feedback |
| 2.6 | Handle text truncation | Detect token limit, truncate, set `isTruncated` flag |
| 2.7 | Auto-retry on failure | Retry pipeline once on any stage failure |

### Phase 3: Frontend ↔ Backend Integration (Week 4)

| # | Task | Details |
|---|------|---------|
| 3.1 | Implement real file upload from `AssignmentUploader` | File validation + POST to upload endpoint |
| 3.2 | Implement status polling in frontend | Poll `GET /api/documents/{id}` until complete/error |
| 3.3 | Replace mock data with real backend data | Fetch document list + detail from REST endpoints |
| 3.4 | Add CopilotKit runtime route for AI feedback agent | `HttpAgent` → `/adk-ai-feedback-agent` |
| 3.5 | Wire AG-UI streaming for live pipeline updates | Optional: stream progress via CopilotKit |
| 3.6 | Add `TruncationBanner` component | Show when `isTruncated` is true |

### Phase 4: Discuss with AI (Week 5)

| # | Task | Details |
|---|------|---------|
| 4.1 | Implement discussion agent | Contextual multi-turn Q&A (read-only, no feedback mutation) |
| 4.2 | Wire `DiscussWithAIPanel` to agent | Real chat via CopilotKit |
| 4.3 | Context passing | Excerpt + feedback + rubric category + full document text |

### Phase 5: Error Handling, Feature Flag & Polish (Week 6)

| # | Task | Details |
|---|------|---------|
| 5.1 | Loading states polish | Card skeleton, analyzing indicator, return-to-latest-state |
| 5.2 | Error handling & retry UI | Error card state, retry button wired to `POST /retry` |
| 5.3 | Feature flag | Tenant-level toggle: hide upload when disabled, keep existing docs visible |
| 5.4 | Quality validation | Excerpt accuracy, rubric consistency tests per PRD metrics |
| 5.5 | Responsive design | Mobile: stack columns, touch-friendly discuss panel |
| 5.6 | End-to-end testing | Full flow: upload → background processing → return → feedback → discuss |

---

## 12. Out of Scope (V1)

- Image-based document uploads (OCR)
- Teacher-defined rubrics
- Re-upload / feedback streams
- Revision tracking / version comparison
- Rubric scores (numeric/level-based)
- Teacher dashboard
- Mobile support
- Persistent database storage

---

## 13. Open Questions

1. **Storage for V1:** Is in-memory agent state sufficient, or do we need a lightweight DB (SQLite/JSON file) for persistence across server restarts?
2. **File processing location:** Should text extraction happen client-side (reducing server load) or server-side (simpler architecture)?
3. **Concurrent uploads:** Should we support multiple simultaneous uploads, or queue them?
4. **Authentication:** How does tenant-level feature flag integrate with the existing auth system?
5. **Token budget:** What's the max token limit for document text sent to Gemini, and how should truncation be communicated in the extracted text viewer?
