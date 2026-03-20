"use client";

import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";

interface FileTypeBadgeProps {
  fileType: "docx" | "pdf";
}

export function FileTypeBadge({ fileType }: FileTypeBadgeProps) {
  return (
    <div className="flex items-center gap-1.5 text-muted-foreground">
      <FileText className="size-4" />
      <span className="text-xs font-medium uppercase">{fileType}</span>
    </div>
  );
}

interface SubjectChipProps {
  subject: string;
}

const subjectColors: Record<string, string> = {
  English: "bg-blue-50 text-blue-700 border-blue-200",
  Science: "bg-green-50 text-green-700 border-green-200",
  History: "bg-amber-50 text-amber-700 border-amber-200",
  Physics: "bg-purple-50 text-purple-700 border-purple-200",
  Biology: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export function SubjectChip({ subject }: SubjectChipProps) {
  const colors = subjectColors[subject] ?? "bg-muted text-muted-foreground border-border";
  return (
    <Badge variant="outline" className={`text-xs font-medium ${colors}`}>
      {subject}
    </Badge>
  );
}
