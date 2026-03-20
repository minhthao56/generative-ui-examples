"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getDocument,
  isProcessing,
  type AIFeedbackDocument,
} from "@/lib/ai-feedback-api";

const POLL_INTERVAL = 3000;

export function useDocument(documentId: string) {
  const [document, setDocument] = useState<AIFeedbackDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchDoc = useCallback(async () => {
    try {
      const doc = await getDocument(documentId);
      setDocument(doc);
      setError(null);
      return doc;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch document");
      return null;
    }
  }, [documentId]);

  // Initial fetch
  useEffect(() => {
    fetchDoc().finally(() => setIsLoading(false));
  }, [fetchDoc]);

  // Poll while document is processing
  useEffect(() => {
    const shouldPoll = document && isProcessing(document.status);

    if (shouldPoll && !pollRef.current) {
      pollRef.current = setInterval(fetchDoc, POLL_INTERVAL);
    } else if (!shouldPoll && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [document, fetchDoc]);

  return { document, isLoading, error };
}
