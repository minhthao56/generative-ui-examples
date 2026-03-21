"use client";

import { useEffect, useRef } from "react";
import { ChevronLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CopilotKit } from "@copilotkit/react-core";
import {
  CopilotChat,
  CopilotChatAssistantMessage,
  type CopilotChatAssistantMessageProps,
  type CopilotChatUserMessageProps,
  useAgent,
  UseAgentUpdate,
} from "@copilotkit/react-core/v2";
import type { FeedbackItem } from "@/lib/ai-feedback-api";

interface DiscussAgentState {
  rubric_category: string;
  excerpt: string;
  feedback_explanation: string;
  document_text: string;
}

interface DiscussWithAIPanelProps {
  documentId: string;
  feedbackItem: FeedbackItem;
  documentText?: string;
  onBack: () => void;
}

export function DiscussWithAIPanel({
  documentId,
  feedbackItem,
  documentText,
  onBack,
}: DiscussWithAIPanelProps) {
  const sessionKey = `${documentId}-${feedbackItem.id}`;

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      {/* Header — AI TUTOR + category name (bold) */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3 shrink-0">
        <Button variant="ghost" size="icon-sm" onClick={onBack}>
          <ChevronLeft className="size-4" />
        </Button>
        <Sparkles className="size-4 text-amber-500" />
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            AI Tutor
          </span>
          <span className="text-sm font-bold text-foreground leading-tight">
            {feedbackItem.rubric_category}
          </span>
        </div>
      </div>

      {/* CopilotKit chat with shared state */}
      <div className="flex-1 min-h-0">
        <CopilotKit
          key={sessionKey}
          runtimeUrl="/api/copilotkit"
          agent="discuss_agent"
        >
          <DiscussChatInner
            feedbackItem={feedbackItem}
            documentText={documentText}
          />
        </CopilotKit>
      </div>
    </Card>
  );
}

/** Extract plain text from a UserMessage content (string or content parts). */
function getMessageText(
  content: CopilotChatUserMessageProps["message"]["content"]
): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("");
  }
  return String(content);
}

/* ── Custom user message: right-aligned, amber bubble ── */

function UserMessageBubble(props: CopilotChatUserMessageProps) {
  const text = getMessageText(props.message.content);
  return (
    <div className="flex justify-end mb-3">
      <div className="max-w-[85%] rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5">
        <p className="text-sm text-foreground/90 italic leading-relaxed">
          &ldquo;{text}&rdquo;
        </p>
      </div>
    </div>
  );
}

/* ── Custom assistant message: left-aligned with blue avatar ── */

function AssistantMessageBubble(props: CopilotChatAssistantMessageProps) {
  return (
    <div className="flex items-start gap-2.5 mb-3">
      {/* Blue circle avatar */}
      <div className="size-7 shrink-0 rounded-full bg-blue-500 flex items-center justify-center mt-0.5">
        <Sparkles className="size-3.5 text-white" />
      </div>
      {/* Message content — reuse default renderer, strip padding/bg */}
      <div className="max-w-[85%] text-sm leading-relaxed">
        <CopilotChatAssistantMessage
          {...props}
          className="!p-0 !bg-transparent !border-none !shadow-none"
        />
      </div>
    </div>
  );
}

/* ── Hidden disclaimer ── */

function HiddenDisclaimer() {
  return null;
}

/* ── Inner chat component ── */

function DiscussChatInner({
  feedbackItem,
  documentText,
}: {
  feedbackItem: FeedbackItem;
  documentText?: string;
}) {
  const docPreview = documentText?.slice(0, 15_000) ?? "";

  const { agent } = useAgent({
    agentId: "discuss_agent",
    updates: [UseAgentUpdate.OnStateChanged],
  });

  const intendedStateRef = useRef<DiscussAgentState | null>(null);

  useEffect(() => {
    const state: DiscussAgentState = {
      rubric_category: feedbackItem.rubric_category,
      excerpt: feedbackItem.excerpt,
      feedback_explanation: feedbackItem.explanation,
      document_text: docPreview,
    };
    intendedStateRef.current = state;
    agent.setState(state);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedbackItem.id]);

  const agentState = agent.state as DiscussAgentState | undefined;
  useEffect(() => {
    if (
      intendedStateRef.current &&
      (!agentState || !agentState.rubric_category)
    ) {
      agent.setState(intendedStateRef.current);
    }
  }, [agentState, agent]);

  return (
    <CopilotChat
      agentId="discuss_agent"
      className="h-full"
      messageView={{
        userMessage: UserMessageBubble as typeof import("@copilotkit/react-core/v2").CopilotChatUserMessage,
        assistantMessage: AssistantMessageBubble as typeof CopilotChatAssistantMessage,
      }}
      input={{
        textArea: { placeholder: "Share your thoughts..." },
        disclaimer: HiddenDisclaimer,
      }}
      welcomeScreen={false}
    />
  );
}
