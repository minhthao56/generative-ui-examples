"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ALLOWED_EXTENSIONS = [".pdf", ".docx"];
const MAX_SIZE = 20 * 1024 * 1024; // 20 MB

interface AssignmentUploaderProps {
  onUpload?: (file: File) => Promise<unknown>;
}

export function AssignmentUploader({ onUpload }: AssignmentUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    if (!ALLOWED_EXTENSIONS.includes(ext) && !ALLOWED_TYPES.includes(file.type)) {
      return "Only .pdf and .docx files are supported.";
    }
    if (file.size > MAX_SIZE) {
      return `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 20 MB.`;
    }
    return null;
  };

  const handleFile = useCallback(
    async (file: File) => {
      setErrorMsg(null);
      const err = validateFile(file);
      if (err) {
        setErrorMsg(err);
        return;
      }
      if (!onUpload) return;

      setIsUploading(true);
      try {
        await onUpload(file);
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setIsUploading(false);
      }
    },
    [onUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      // Reset so the same file can be uploaded again
      e.target.value = "";
    },
    [handleFile]
  );

  return (
    <div>
      <Card
        className={`border-2 border-dashed p-8 transition-colors cursor-pointer ${
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-border bg-muted/30 hover:border-primary/50"
        } ${isUploading ? "pointer-events-none opacity-60" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
            {isUploading ? (
              <Loader2 className="size-5 animate-spin text-primary" />
            ) : (
              <Upload className="size-5 text-primary" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium">
              {isUploading ? "Uploading..." : "Drop your assignment here"}
            </p>
            <p className="text-xs text-muted-foreground">
              PDF or Word (.pdf, .docx) — max 20 MB
            </p>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleInputChange}
        />
      </Card>
      {errorMsg && (
        <p className="mt-2 text-xs text-destructive">{errorMsg}</p>
      )}
    </div>
  );
}
