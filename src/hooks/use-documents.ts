"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  listDocuments,
  uploadDocument as apiUpload,
  retryDocument as apiRetry,
  isProcessing,
  type AIFeedbackDocument,
} from "@/lib/ai-feedback-api";

const POLL_INTERVAL = 3000;

export function useDocuments() {
  const [documents, setDocuments] = useState<AIFeedbackDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchDocs = useCallback(async () => {
    try {
      const docs = await listDocuments();
      setDocuments(docs);
      return docs;
    } catch {
      // Silently fail on poll — backend might not be running
      return documents;
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchDocs().finally(() => setIsLoading(false));
  }, [fetchDocs]);

  // Poll while any document is processing
  useEffect(() => {
    const hasProcessing = documents.some((d) => isProcessing(d.status));

    if (hasProcessing && !pollRef.current) {
      pollRef.current = setInterval(fetchDocs, POLL_INTERVAL);
    } else if (!hasProcessing && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [documents, fetchDocs]);

  const uploadDocument = useCallback(
    async (file: File) => {
      const result = await apiUpload(file);
      // Immediately refetch to show the new card
      await fetchDocs();
      return result;
    },
    [fetchDocs]
  );

  const retryDocument = useCallback(
    async (id: string) => {
      const result = await apiRetry(id);
      await fetchDocs();
      return result;
    },
    [fetchDocs]
  );

  return { documents, isLoading, uploadDocument, retryDocument };
}
