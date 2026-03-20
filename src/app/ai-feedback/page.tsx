"use client";

import { AssignmentUploader } from "@/components/ai-feedback/assignment-uploader";
import { AssignmentCard } from "@/components/ai-feedback/assignment-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocuments } from "@/hooks/use-documents";

export default function AIFeedbackHomePage() {
  const { documents, isLoading, uploadDocument, retryDocument } = useDocuments();

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-2xl font-bold">My Assignments</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Upload your work and get AI-powered feedback before you submit.
      </p>

      <div className="mt-6">
        <AssignmentUploader onUpload={uploadDocument} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {isLoading ? (
          <>
            <Skeleton className="h-48 rounded-lg" />
            <Skeleton className="h-48 rounded-lg" />
          </>
        ) : documents.length === 0 ? (
          <p className="col-span-2 py-8 text-center text-sm text-muted-foreground">
            No assignments yet. Upload one to get started.
          </p>
        ) : (
          documents.map((doc) => (
            <AssignmentCard
              key={doc.id}
              document={doc}
              onRetry={retryDocument}
            />
          ))
        )}
      </div>
    </div>
  );
}
