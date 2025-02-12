import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { FileIcon, Upload, Loader2 } from "lucide-react";
import { Card } from "./ui/card";
import { extractTextFromPDF } from "@/lib/pdf";
import { useToast } from "@/hooks/use-toast";

interface UploadAreaProps {
  onContentExtracted: (content: string) => void;
  onProgress?: (progress: number) => void;
  onAnalyzing?: (analyzing: boolean) => void;
  isLoading?: boolean;
}

export function UploadArea({ onContentExtracted, onProgress, onAnalyzing, isLoading }: UploadAreaProps) {
  const { toast } = useToast();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      try {
        toast({
          title: "Processing PDF",
          description: "Please wait while we process your document...",
          duration: 10000,
        });

        if (onAnalyzing) onAnalyzing(true);
        if (onProgress) onProgress(0);

        const text = await extractTextFromPDF(file);
        onContentExtracted(text);

        if (onProgress) onProgress(100);
        if (onAnalyzing) onAnalyzing(false);

        toast({
          title: "Document Processed",
          description: "Your document has been successfully processed.",
          duration: 5000,
        });
      } catch (error) {
        console.error("Error processing file:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to process PDF file";

        if (onProgress) onProgress(0);
        if (onAnalyzing) onAnalyzing(false);

        toast({
          title: "Error Processing PDF",
          description: errorMessage,
          variant: "destructive",
          duration: 10000,
        });
      }
    },
    [onContentExtracted, onProgress, onAnalyzing, toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    multiple: false,
    disabled: isLoading,
  });

  return (
    <Card
      {...getRootProps()}
      className={`p-4 border-2 border-dashed cursor-pointer transition-colors ${
        isDragActive ? "border-primary bg-primary/5" : "border-border"
      } ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
    >
      <input {...getInputProps()} />
      <div className="flex items-center justify-center gap-2">
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-sm">Processing...</span>
          </>
        ) : isDragActive ? (
          <>
            <FileIcon className="w-5 h-5 text-primary" />
            <span className="text-sm">Drop here</span>
          </>
        ) : (
          <>
            <Upload className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm">Upload PDF (Optional)</span>
          </>
        )}
      </div>
    </Card>
  );
}