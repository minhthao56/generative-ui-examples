"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ChevronLeft, FileText, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubjectChip } from "@/components/ai-feedback/file-type-badge";
import { ExtractedTextViewer } from "@/components/ai-feedback/extracted-text-viewer";
import { FeedbackPanel } from "@/components/ai-feedback/feedback-panel";
import { DiscussWithAIPanel } from "@/components/ai-feedback/discuss-with-ai-panel";
import { TruncationBanner } from "@/components/ai-feedback/truncation-banner";
import { getDocumentById } from "@/components/ai-feedback/mock-data";
import type { FeedbackItem } from "@/components/ai-feedback/mock-data";

export default function DocumentDetailPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = use(params);
  const doc = getDocumentById(documentId);
  const [discussItem, setDiscussItem] = useState<FeedbackItem | null>(null);

  if (!doc) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Document not found.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-3 border-b border-border px-6 py-3">
        <Link href="/ai-feedback">
          <Button variant="ghost" size="icon-sm">
            <ChevronLeft className="size-4" />
          </Button>
        </Link>
        <FileText className="size-4 text-muted-foreground shrink-0" />
        <span className="text-sm font-medium truncate">{doc.title}</span>
        <div className="ml-auto flex items-center gap-2">
          <SubjectChip subject={doc.subject} />
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {doc.createdAt}
          </span>
          <Button variant="ghost" size="icon-sm">
            <MoreVertical className="size-4" />
          </Button>
        </div>
      </div>

      {/* Two-column content — stacks on mobile */}
      <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4 lg:flex-row">
        {/* Left: Extracted text */}
        <div className="flex-1 min-w-0 min-h-0">
          <ExtractedTextViewer text={doc.extractedText} />
        </div>

        {/* Right: Feedback or Discuss panel */}
        <div className="w-full shrink-0 lg:w-[420px]">
          <div className="flex h-full flex-col gap-3">
            {doc.isTruncated && <TruncationBanner />}
            <div className="flex-1 min-h-0">
              {discussItem ? (
                <DiscussWithAIPanel
                  feedbackItem={discussItem}
                  onBack={() => setDiscussItem(null)}
                />
              ) : (
                <FeedbackPanel
                  feedbackItems={doc.feedbackItems}
                  onDiscuss={setDiscussItem}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
