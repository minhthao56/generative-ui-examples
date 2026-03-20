"use client";

import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FeedbackItemCard } from "./feedback-item";
import type { FeedbackItem } from "./mock-data";

interface FeedbackPanelProps {
  feedbackItems: FeedbackItem[];
  onDiscuss: (item: FeedbackItem) => void;
}

export function FeedbackPanel({ feedbackItems, onDiscuss }: FeedbackPanelProps) {
  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-5 py-3">
        <Sparkles className="size-4 text-primary" />
        <span className="text-sm font-semibold">AI Feedback</span>
      </div>
      <ScrollArea className="flex-1 px-5 py-4">
        <div className="space-y-5">
          {feedbackItems.map((item, i) => (
            <FeedbackItemCard
              key={item.id}
              item={item}
              index={i}
              onDiscuss={onDiscuss}
            />
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
