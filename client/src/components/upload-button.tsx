import { Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDropzone } from "react-dropzone";

interface UploadButtonProps {
  onContentExtracted: (content: string) => void;
  onProgress: (progress: number) => void;
  onAnalyzing: (isAnalyzing: boolean) => void;
}

export function UploadButton({
  onContentExtracted,
  onProgress,
  onAnalyzing,
}: UploadButtonProps) {
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      const formData = new FormData();
      formData.append("file", file);

      try {
        onAnalyzing(true);
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        const result = await response.json();
        onContentExtracted(result.content);
      } catch (error) {
        console.error("Upload error:", error);
      } finally {
        onAnalyzing(false);
        onProgress(0);
      }
    },
    maxFiles: 1,
  });

  return (
    <div {...getRootProps()}>
      <Button variant="ghost" size="icon" className="h-9 w-9" title="Upload financial statements for review">
        <input {...getInputProps()} />
        <Paperclip className="h-5 w-5" />
      </Button>
    </div>
  );
}