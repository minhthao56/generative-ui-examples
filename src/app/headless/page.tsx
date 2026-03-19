"use client";
import { useAgent } from "@copilotkit/react-core/v2";

export default function HomePage() {
  const { agent } = useAgent({ agentId: "my_agent" });

  return (
    <div>
      {agent.messages.map((m) => (
        <p key={m.id}>{JSON.stringify(m)}</p>
      ))}
      <button
        onClick={() => {
          agent.setMessages([
            {
              role: "user",
              content: "what can you do?",
              id: "1",
            },
          ]);
          agent.runAgent(); // returns Promise — no subscription needed
        }}
      >
        {agent.isRunning ? "Thinking..." : "Send"}
      </button>
    </div>
  );
}
