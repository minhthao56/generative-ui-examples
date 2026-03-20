"use client";

import { MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { FeedbackItem as FeedbackItemType } from "./mock-data";

const rubricColors: Record<string, string> = {
  "Argument Structure": "text-orange-600",
  "Evidence & Sources": "text-red-600",
  "Critical Thinking": "text-blue-600",
  "Grammar & Style": "text-purple-600",
  "Data Interpretation": "text-emerald-600",
  Methodology: "text-teal-600",
};

interface FeedbackItemProps {
  item: FeedbackItemType;
  index: number;
  onDiscuss: (item: FeedbackItemType) => void;
}

export function FeedbackItemCard({ item, index, onDiscuss }: FeedbackItemProps) {
  const color = rubricColors[item.rubricCategory] ?? "text-primary";

  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-2">
        <span className={`text-sm font-bold ${color}`}>{index + 1}</span>
        <Badge variant="outline" className={`text-xs font-semibold ${color} border-current/20`}>
          {item.rubricCategory}
        </Badge>
      </div>

      <blockquote className="border-l-3 border-amber-400 bg-amber-50 px-3 py-2 text-sm italic text-foreground/80">
        {item.excerpt}
      </blockquote>

      <p className="text-sm leading-relaxed text-foreground">
        {item.explanation}
      </p>

      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-muted-foreground"
        onClick={() => onDiscuss(item)}
      >
        <MessageSquare className="size-3.5" />
        Discuss this with AI
      </Button>

      <Separator />
    </div>
  );
}
