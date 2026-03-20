"use client";

import { useState } from "react";
import { ChevronLeft, Send, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import type { FeedbackItem } from "@/lib/ai-feedback-api";

interface DiscussMessage {
  id: string;
  role: "user" | "ai";
  content: string;
}

interface DiscussWithAIPanelProps {
  feedbackItem: FeedbackItem;
  onBack: () => void;
}

export function DiscussWithAIPanel({
  feedbackItem,
  onBack,
}: DiscussWithAIPanelProps) {
  const [messages, setMessages] = useState<DiscussMessage[]>([]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: DiscussMessage = {
      id: `msg-user-${Date.now()}`,
      role: "user",
      content: input.trim(),
    };
    // TODO: Phase 4 — wire to real AI agent via CopilotKit
    const aiMsg: DiscussMessage = {
      id: `msg-ai-${Date.now()}`,
      role: "ai",
      content:
        "That's a great question! Let me help you think through this. Consider how you might strengthen this section by providing more specific evidence and addressing potential counterarguments directly.",
    };
    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setInput("");
  };

  return (
    <Card className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Button variant="ghost" size="icon-sm" onClick={onBack}>
          <ChevronLeft className="size-4" />
        </Button>
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-amber-500" />
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            AI Tutor
          </span>
        </div>
        <Badge variant="outline" className="ml-auto text-xs font-medium">
          {feedbackItem.rubric_category}
        </Badge>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4">
        <div className="space-y-4">
          {/* Initial context: excerpt + feedback */}
          <blockquote className="border-l-3 border-amber-400 bg-amber-50 px-3 py-2 text-sm italic text-foreground/80">
            {feedbackItem.excerpt}
          </blockquote>

          <div className="flex gap-3">
            <Avatar className="size-6 shrink-0 mt-0.5">
              <AvatarFallback className="bg-amber-100 text-amber-700 text-[10px]">
                AI
              </AvatarFallback>
            </Avatar>
            <p className="text-sm leading-relaxed text-foreground">
              {feedbackItem.explanation}
            </p>
          </div>

          {/* Chat messages */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
            >
              {msg.role === "ai" && (
                <Avatar className="size-6 shrink-0 mt-0.5">
                  <AvatarFallback className="bg-amber-100 text-amber-700 text-[10px]">
                    AI
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border p-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Share your thoughts..."
            className="min-h-[40px] max-h-[120px] resize-none text-sm"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button size="icon" onClick={handleSend} disabled={!input.trim()}>
            <Send className="size-4" />
          </Button>
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </Card>
  );
}
