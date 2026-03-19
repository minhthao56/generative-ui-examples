
import { CopilotKit } from "@copilotkit/react-core";

export default function GenerativeUILayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <CopilotKit runtimeUrl="/api/copilotkit" agent="my_agent">
            {children}
        </CopilotKit>
    );
}
