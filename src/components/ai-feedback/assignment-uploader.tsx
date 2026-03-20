"use client";

import { Upload } from "lucide-react";
import { Card } from "@/components/ui/card";

export function AssignmentUploader() {
  return (
    <Card className="border-2 border-dashed border-border bg-muted/30 p-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
          <Upload className="size-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium">Drop your assignment here</p>
          <p className="text-xs text-muted-foreground">
            PDF or Word (.pdf, .docx) — max 20 MB
          </p>
        </div>
      </div>
    </Card>
  );
}
