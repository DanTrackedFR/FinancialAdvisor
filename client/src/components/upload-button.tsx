import { Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div {...getRootProps()}>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <input {...getInputProps()} />
              <Paperclip className="h-5 w-5" />
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Please upload financial statements (or any finance document) for review and feedback</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
