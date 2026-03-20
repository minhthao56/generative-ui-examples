/**
 * API client for AI Feedback backend (FastAPI on :8000).
 */

const API_BASE = "http://localhost:8000/api/documents";

// --- Types matching backend models ---

export interface RubricCategory {
  name: string;
  description: string;
}

export interface FeedbackItem {
  id: string;
  document_title: string;
  rubric_category: string;
  excerpt: string;
  explanation: string;
}

export type DocumentStatus =
  | "uploading"
  | "extracting"
  | "analyzing"
  | "complete"
  | "error";

export interface AIFeedbackDocument {
  id: string;
  file_name: string;
  file_type: "docx" | "pdf";
  title: string;
  subject: string;
  extracted_text: string;
  rubric_categories: RubricCategory[];
  status: DocumentStatus;
  feedback_items: FeedbackItem[];
  feedback_count: number;
  is_truncated: boolean;
  error_message: string | null;
  created_at: string;
}

// --- API functions ---

export async function uploadDocument(
  file: File
): Promise<{ id: string; status: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(err.detail || "Upload failed");
  }

  return res.json();
}

export async function listDocuments(): Promise<AIFeedbackDocument[]> {
  const res = await fetch(API_BASE);
  if (!res.ok) throw new Error("Failed to fetch documents");
  return res.json();
}

export async function getDocument(id: string): Promise<AIFeedbackDocument> {
  const res = await fetch(`${API_BASE}/${id}`);
  if (!res.ok) {
    if (res.status === 404) throw new Error("Document not found");
    throw new Error("Failed to fetch document");
  }
  return res.json();
}

export async function retryDocument(
  id: string
): Promise<{ id: string; status: string }> {
  const res = await fetch(`${API_BASE}/${id}/retry`, { method: "POST" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Retry failed" }));
    throw new Error(err.detail || "Retry failed");
  }
  return res.json();
}

/** Check if a document is still processing */
export function isProcessing(status: DocumentStatus): boolean {
  return status === "uploading" || status === "extracting" || status === "analyzing";
}
