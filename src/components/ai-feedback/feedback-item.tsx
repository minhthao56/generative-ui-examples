"use client";

import { MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { FeedbackItem } from "@/lib/ai-feedback-api";

const RUBRIC_COLORS: Record<string, string> = {
  "Argument Structure": "text-orange-600",
  "Evidence & Sources": "text-red-600",
  "Evidence & Analysis": "text-red-600",
  "Evidence Quality": "text-red-600",
  "Critical Thinking": "text-blue-600",
  "Grammar & Style": "text-purple-600",
  "Clarity & Language": "text-purple-600",
  "Data Interpretation": "text-emerald-600",
  Methodology: "text-teal-600",
  "Scientific Accuracy": "text-cyan-600",
  "Conclusion Quality": "text-indigo-600",
  Structure: "text-amber-600",
  Clarity: "text-violet-600",
  Grammar: "text-pink-600",
};

function getRubricColor(category: string): string {
  return RUBRIC_COLORS[category] ?? "text-primary";
}

interface FeedbackItemProps {
  item: FeedbackItem;
  index: number;
  onDiscuss: (item: FeedbackItem) => void;
}

export function FeedbackItemCard({ item, index, onDiscuss }: FeedbackItemProps) {
  const color = getRubricColor(item.rubric_category);

  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-2">
        <span className={`text-sm font-bold ${color}`}>{index + 1}</span>
        <Badge variant="outline" className={`text-xs font-semibold ${color} border-current/20`}>
          {item.rubric_category}
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
