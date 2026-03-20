"use client";

import Link from "next/link";
import { Sparkles, Loader2, AlertCircle, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileTypeBadge, SubjectChip } from "./file-type-badge";
import type { AIFeedbackDocument } from "./mock-data";

interface AssignmentCardProps {
  document: AIFeedbackDocument;
}

export function AssignmentCard({ document: doc }: AssignmentCardProps) {
  if (doc.status === "uploading" || doc.status === "extracting" || doc.status === "analyzing") {
    return <AssignmentCardLoading document={doc} />;
  }

  if (doc.status === "error") {
    return <AssignmentCardError document={doc} />;
  }

  return (
    <Link href={`/ai-feedback/${doc.id}`}>
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardContent className="flex h-full flex-col gap-3 p-5">
          <div className="flex items-center justify-between">
            <FileTypeBadge fileType={doc.fileType} />
            <SubjectChip subject={doc.subject} />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold leading-snug">{doc.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {doc.extractedText.slice(0, 120)}...
            </p>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-primary font-medium">
              <Sparkles className="size-3" />
              {doc.feedbackCount} AI Feedback
            </span>
            <span className="text-muted-foreground">{doc.createdAt}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function AssignmentCardLoading({ document: doc }: { document: AIFeedbackDocument }) {
  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col gap-3 p-5">
        <div className="flex items-center justify-between">
          <FileTypeBadge fileType={doc.fileType} />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-4">
          <Loader2 className="size-5 animate-spin text-primary" />
          <p className="text-xs font-medium text-muted-foreground">
            Analyzing your document…
          </p>
        </div>
        <div className="flex justify-end">
          <span className="text-xs text-muted-foreground">{doc.createdAt}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function AssignmentCardError({ document: doc }: { document: AIFeedbackDocument }) {
  return (
    <Card className="h-full border-destructive/30">
      <CardContent className="flex h-full flex-col gap-3 p-5">
        <div className="flex items-center justify-between">
          <FileTypeBadge fileType={doc.fileType} />
          {doc.subject && <SubjectChip subject={doc.subject} />}
        </div>
        <div className="flex-1">
          {doc.title && (
            <h3 className="text-sm font-semibold leading-snug">{doc.title}</h3>
          )}
          <div className="mt-2 flex items-center gap-1.5 text-destructive">
            <AlertCircle className="size-3.5" />
            <p className="text-xs">{doc.errorMessage ?? "Analysis failed."}</p>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs">
          <Button variant="ghost" size="xs" className="gap-1 text-primary">
            <RotateCcw className="size-3" />
            Retry
          </Button>
          <span className="text-muted-foreground">{doc.createdAt}</span>
        </div>
      </CardContent>
    </Card>
  );
}
