
import { CopilotKit } from "@copilotkit/react-core";

export default function HeadlessUILayout({
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
