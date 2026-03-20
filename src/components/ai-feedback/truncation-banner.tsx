"use client";

import { useState } from "react";
import { Info, X } from "lucide-react";

export function TruncationBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
      <Info className="size-4 shrink-0" />
      <p className="flex-1">
        Only part of your document was used to generate feedback due to length
        limits.
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 text-blue-600 hover:text-blue-800"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
