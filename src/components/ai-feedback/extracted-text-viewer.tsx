"use client";

import { FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import Markdown from "react-markdown";

interface ExtractedTextViewerProps {
  text: string;
}

export function ExtractedTextViewer({ text }: ExtractedTextViewerProps) {
  return (
    <Card className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-5 py-3 shrink-0">
        <FileText className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">
          Extracted Text
        </span>
      </div>
      <ScrollArea className="flex-1 min-h-0 px-5 py-4">
        <div className="prose prose-sm max-w-none">
          <Markdown>{text}</Markdown>
        </div>
      </ScrollArea>
    </Card>
  );
}
