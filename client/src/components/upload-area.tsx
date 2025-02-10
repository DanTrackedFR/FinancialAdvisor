import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { FileIcon, Upload, Loader2 } from "lucide-react";
import { Card } from "./ui/card";
import { extractTextFromPDF } from "@/lib/pdf";
import { useToast } from "@/hooks/use-toast";

interface UploadAreaProps {
  onFileProcessed: (fileName: string, content: string) => void;
  isLoading?: boolean;
}

export function UploadArea({ onFileProcessed, isLoading }: UploadAreaProps) {
  const { toast } = useToast();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      try {
        toast({
          title: "Processing PDF",
          description: "Please wait while we process your document. This may take longer for scanned documents...",
          duration: 10000,
        });

        const text = await extractTextFromPDF(file);
        onFileProcessed(file.name, text);
      } catch (error) {
        console.error("Error processing file:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to process PDF file";

        toast({
          title: "Error Processing PDF",
          description: errorMessage,
          variant: "destructive",
          duration: 10000,
        });
      }
    },
    [onFileProcessed, toast]
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
    <div className="space-y-4">
      <Card
        {...getRootProps()}
        className={`p-8 border-2 border-dashed cursor-pointer transition-colors ${
          isDragActive ? "border-primary bg-primary/5" : "border-border"
        } ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4 text-center">
          {isLoading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="mt-2">Processing your document...</p>
              <p className="text-sm text-muted-foreground">This may take a few moments</p>
            </div>
          ) : isDragActive ? (
            <>
              <FileIcon className="w-12 h-12 text-primary" />
              <p>Drop the file here...</p>
            </>
          ) : (
            <>
              <Upload className="w-12 h-12 text-muted-foreground" />
              <div>
                <p className="text-lg font-medium">Upload Financial Statement</p>
                <p className="text-sm text-muted-foreground">
                  Drag and drop a PDF file here, or click to select
                </p>
              </div>
            </>
          )}
        </div>
      </Card>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Tip: We support both digital PDFs and scanned documents. Processing scanned documents may take longer.
        </p>
      </div>
    </div>
  );
}