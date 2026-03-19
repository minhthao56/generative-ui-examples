"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <div>
      Example With ADK + CopilotChat
      <Link href="/generative-ui" className="text-blue-500 underline">
        Go to Generative UI Example
      </Link>
      <br />
      Example With ADK + No UI
      <Link href="/headless" className="text-blue-500 underline">
        Go to Headless Example
      </Link>
    </div>
  );
}
