"use client";

import { Sparkles, Bell } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function AIFeedbackHeader() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-6">
      <div className="flex items-center gap-2">
        <Sparkles className="size-5 text-primary" />
        <span className="text-base font-semibold">AI Feedback</span>
      </div>
      <div className="flex items-center gap-3">
        <button className="text-muted-foreground hover:text-foreground">
          <Bell className="size-5" />
        </button>
        <div className="flex items-center gap-2">
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              S
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground hidden sm:inline">
            LMS学生 生徒04
          </span>
        </div>
      </div>
    </header>
  );
}
