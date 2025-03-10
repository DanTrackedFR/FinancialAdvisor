import { useCallback, useState, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { FileIcon, Upload, Loader2, XCircle } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { extractTextFromPDF, cancelExtraction } from "@/lib/pdf";
import { useToast } from "@/hooks/use-toast";

interface UploadAreaProps {
  onContentExtracted: (content: string) => void;
  onProgress?: (progress: number | ((prev: number) => number)) => void;
  onAnalyzing?: (analyzing: boolean) => void;
  isLoading?: boolean;
}

export function UploadArea({ onContentExtracted, onProgress, onAnalyzing, isLoading }: UploadAreaProps) {
  const { toast } = useToast();
  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractionId, setExtractionId] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (extractionId) {
        cancelExtraction(extractionId);
      }
    };
  }, [extractionId]);

  // Handle cancel button click
  const handleCancel = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    if (extractionId) {
      cancelExtraction(extractionId);
      setExtractionId(null);
    }
    
    // Reset states
    setShowProgress(false);
    setProgress(0);
    setFileName(null);
    
    if (onProgress) onProgress(0);
    if (onAnalyzing) onAnalyzing(false);
    
    toast({
      title: "Upload Cancelled",
      description: "PDF upload has been cancelled.",
      duration: 3000,
    });
  }, [extractionId, onProgress, onAnalyzing, toast]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      
      // If there's an active extraction, cancel it
      if (extractionId) {
        cancelExtraction(extractionId);
      }
      
      // Reset progress state
      setProgress(0);
      setShowProgress(true);
      setFileName(file.name);
      
      // Generate a unique extraction ID
      const newExtractionId = `pdf-${Date.now()}`;
      setExtractionId(newExtractionId);

      try {
        console.log("Starting PDF processing for file:", file.name, "size:", file.size);
        
        toast({
          title: "Processing PDF",
          description: "Please wait while we process your document...",
          duration: 5000,
        });

        if (onAnalyzing) onAnalyzing(true);
        
        // Show incremental progress
        setProgress(10);
        if (onProgress) onProgress(10);
        
        // Clean up any existing interval
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
        
        // Set up an interval to show progress animation
        progressIntervalRef.current = setInterval(() => {
          setProgress(prev => {
            const next = prev + (prev < 30 ? 5 : prev < 60 ? 3 : 1);
            const cappedNext = next < 90 ? next : 90; // Cap at 90% until complete
            if (onProgress) onProgress(cappedNext);
            return cappedNext;
          });
        }, 1000);

        console.log("Calling extractTextFromPDF function...");
        const text = await extractTextFromPDF(file, newExtractionId);
        console.log("PDF text extraction successful. Text length:", text.length);
        
        // Clear the progress interval
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        
        // Set progress to 100%
        setProgress(100);
        if (onProgress) onProgress(100);
        
        // Hide progress after a delay
        setTimeout(() => {
          setShowProgress(false);
          setProgress(0);
          setFileName(null);
          setExtractionId(null);
        }, 1500);
        
        onContentExtracted(text);
        if (onAnalyzing) onAnalyzing(false);

        toast({
          title: "Document Processed",
          description: "Your document has been successfully processed.",
          duration: 3000,
        });
      } catch (error) {
        console.error("Error processing file:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to process PDF file";
        console.log("Error details:", error);

        // Clear the progress interval
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        
        // Reset the progress unless it was cancelled
        if (!errorMessage.includes('cancelled')) {
          setProgress(0);
          if (onProgress) onProgress(0);
        }
        
        // Hide progress after a delay
        setTimeout(() => {
          setShowProgress(false);
          setProgress(0);
          setFileName(null);
        }, 1500);
        
        setExtractionId(null);
        if (onAnalyzing) onAnalyzing(false);

        toast({
          title: "Error Processing PDF",
          description: errorMessage,
          variant: "destructive",
          duration: 5000,
        });
      }
    },
    [onContentExtracted, onProgress, onAnalyzing, toast, extractionId]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    multiple: false,
    disabled: isLoading || !!extractionId,
    noClick: showProgress, // Disable click when progress is shown
  });

  // Render the upload area with progress indicator
  return (
    <div className="w-full">
      <Card
        {...getRootProps()}
        className={`p-4 border-2 border-dashed cursor-pointer transition-colors ${
          isDragActive ? "border-primary bg-primary/5" : "border-border"
        } ${(isLoading || !!extractionId) ? "opacity-70" : ""}`}
      >
        <input {...getInputProps()} />
        
        {showProgress ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileIcon className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium truncate max-w-[150px]">{fileName}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCancel}
                type="button"
                className="h-8 w-8 p-0"
              >
                <XCircle className="h-5 w-5 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Processing PDF...</span>
              <span>{progress}%</span>
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-sm">Processing...</span>
          </div>
        ) : isDragActive ? (
          <div className="flex items-center justify-center gap-2">
            <FileIcon className="w-5 h-5 text-primary" />
            <span className="text-sm">Drop here</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <Upload className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm">Upload PDF (Optional)</span>
          </div>
        )}
      </Card>
    </div>
  );
}