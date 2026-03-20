import { AIFeedbackHeader } from "@/components/ai-feedback/header";

export default function AIFeedbackLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen flex-col bg-background">
      <AIFeedbackHeader />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
