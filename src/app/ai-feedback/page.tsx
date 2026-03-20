import { AssignmentUploader } from "@/components/ai-feedback/assignment-uploader";
import { AssignmentCard } from "@/components/ai-feedback/assignment-card";
import { MOCK_DOCUMENTS } from "@/components/ai-feedback/mock-data";

export default function AIFeedbackHomePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-2xl font-bold">My Assignments</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Upload your work and get AI-powered feedback before you submit.
      </p>

      <div className="mt-6">
        <AssignmentUploader />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {MOCK_DOCUMENTS.map((doc) => (
          <AssignmentCard key={doc.id} document={doc} />
        ))}
      </div>
    </div>
  );
}
