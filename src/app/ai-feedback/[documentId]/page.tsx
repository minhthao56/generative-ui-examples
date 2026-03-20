"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ChevronLeft, FileText, Loader2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SubjectChip } from "@/components/ai-feedback/file-type-badge";
import { ExtractedTextViewer } from "@/components/ai-feedback/extracted-text-viewer";
import { FeedbackPanel } from "@/components/ai-feedback/feedback-panel";
import { DiscussWithAIPanel } from "@/components/ai-feedback/discuss-with-ai-panel";
import { TruncationBanner } from "@/components/ai-feedback/truncation-banner";
import { useDocument } from "@/hooks/use-document";
import { isProcessing } from "@/lib/ai-feedback-api";
import type { FeedbackItem } from "@/lib/ai-feedback-api";

export default function DocumentDetailPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = use(params);
  const { document: doc, isLoading, error } = useDocument(documentId);
  const [discussItem, setDiscussItem] = useState<FeedbackItem | null>(null);

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (error || !doc) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2">
        <p className="text-muted-foreground">{error || "Document not found."}</p>
        <Link href="/ai-feedback">
          <Button variant="outline" size="sm">Back to assignments</Button>
        </Link>
      </div>
    );
  }

  const stillProcessing = isProcessing(doc.status);

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
        <span className="text-sm font-medium truncate">
          {doc.title || doc.file_name}
        </span>
        <div className="ml-auto flex items-center gap-2">
          {doc.subject && <SubjectChip subject={doc.subject} />}
          <Button variant="ghost" size="icon-sm">
            <MoreVertical className="size-4" />
          </Button>
        </div>
      </div>

      {/* Two-column content — stacks on mobile */}
      <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4 lg:flex-row">
        {/* Left: Extracted text */}
        <div className="flex-1 min-w-0 min-h-0">
          {doc.extracted_text ? (
            <ExtractedTextViewer text={doc.extracted_text} />
          ) : (
            <Card className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="size-5 animate-spin" />
                <p className="text-sm">Extracting text...</p>
              </div>
            </Card>
          )}
        </div>

        {/* Right: Feedback or Discuss panel */}
        <div className="w-full shrink-0 lg:w-[420px]">
          <div className="flex h-full flex-col gap-3">
            {doc.is_truncated && <TruncationBanner />}
            <div className="flex-1 min-h-0">
              {stillProcessing ? (
                <Card className="flex h-full items-center justify-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="size-5 animate-spin" />
                    <p className="text-sm">Generating feedback...</p>
                    <p className="text-xs">This may take a minute</p>
                  </div>
                </Card>
              ) : discussItem ? (
                <DiscussWithAIPanel
                  feedbackItem={discussItem}
                  onBack={() => setDiscussItem(null)}
                />
              ) : (
                <FeedbackPanel
                  feedbackItems={doc.feedback_items}
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

function DetailSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border px-6 py-3">
        <Skeleton className="size-7 rounded" />
        <Skeleton className="h-4 w-64" />
        <div className="ml-auto flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
      <div className="flex flex-1 gap-4 p-4">
        <Skeleton className="flex-1 rounded-lg" />
        <Skeleton className="w-[420px] rounded-lg" />
      </div>
    </div>
  );
}
