"use client";

import { FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ExtractedTextViewerProps {
  text: string;
}

export function ExtractedTextViewer({ text }: ExtractedTextViewerProps) {
  const paragraphs = text.split("\n\n").filter(Boolean);

  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-5 py-3">
        <FileText className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">
          Extracted Text
        </span>
      </div>
      <ScrollArea className="flex-1 px-5 py-4">
        <div className="prose prose-sm max-w-none">
          {paragraphs.map((p, i) => {
            const trimmed = p.trim();
            // Heuristic: short lines without periods are likely headings
            const isHeading =
              trimmed.length < 60 && !trimmed.endsWith(".");
            if (isHeading) {
              return (
                <h3 key={i} className="mt-6 mb-2 text-base font-bold first:mt-0">
                  {trimmed}
                </h3>
              );
            }
            return (
              <p key={i} className="mb-3 text-sm leading-relaxed text-foreground">
                {trimmed}
              </p>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
}
