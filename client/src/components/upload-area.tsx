import { useCallback, useState, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { FileIcon, Upload, Loader2, XCircle, AlertCircle } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { extractTextFromPDF, cancelExtraction } from "@/lib/pdf";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "./ui/alert";

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
  const [errorState, setErrorState] = useState<string | null>(null);
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
      // Reset error state first
      setErrorState(null);
      
      const file = acceptedFiles[0];
      if (!file) return;
      
      // Enhanced file validation
      const isPdfByMimeType = file.type.includes('pdf');
      const isPdfByExtension = file.name.toLowerCase().endsWith('.pdf');
      
      if (!isPdfByMimeType && !isPdfByExtension) {
        setErrorState('Please upload a PDF file. Only PDF documents are supported.');
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF file. Only PDF documents are supported.",
          variant: "destructive",
          duration: 5000,
        });
        return;
      }
      
      // Additional validation for potential file issues
      if (file.size < 100) {
        setErrorState('The file appears to be empty or corrupted. Please upload a valid PDF document.');
        toast({
          title: "Invalid File",
          description: "The file appears to be empty or corrupted. Please upload a valid PDF document.",
          variant: "destructive",
          duration: 5000,
        });
        return;
      }
      
      // Check file size (max 20MB)
      const maxSizeInBytes = 20 * 1024 * 1024;
      if (file.size > maxSizeInBytes) {
        setErrorState('The PDF file is too large. Please upload a file smaller than 20MB.');
        toast({
          title: "File Too Large",
          description: "The PDF file is too large. Please upload a file smaller than 20MB.",
          variant: "destructive",
          duration: 5000,
        });
        return;
      }
      
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
        
        // Add progressive progress updates during extraction
        let progressUpdateInterval = setInterval(() => {
          // Increment progress in smaller steps during extraction
          setProgress(prev => {
            const increment = prev < 50 ? 5 : prev < 75 ? 2 : 1;
            const newProgress = Math.min(prev + increment, 90);
            if (onProgress) onProgress(newProgress);
            return newProgress;
          });
        }, 800);
        
        let extractedText: string;
        try {
          // Perform the actual PDF extraction
          extractedText = await extractTextFromPDF(file, newExtractionId);
          clearInterval(progressUpdateInterval);
          
          // Validate the extracted text
          if (!extractedText || extractedText.trim().length === 0) {
            throw new Error('No text content could be extracted from this PDF.');
          }
          
          console.log("PDF text extraction successful. Text length:", extractedText.length);
        } catch (extractionError) {
          clearInterval(progressUpdateInterval);
          throw extractionError; // Re-throw to be caught by outer catch
        }
        
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
        
        // Call parent's callback with the extracted text
        // This should be done before the timeout to ensure the parent processes it immediately
        onContentExtracted(extractedText);
        if (onAnalyzing) onAnalyzing(false);

        toast({
          title: "Document Processed",
          description: "Your document has been successfully processed.",
          duration: 3000,
        });
      } catch (error) {
        console.error("Error processing file:", error);
        
        let errorMessage = "Failed to process PDF file";
        if (error instanceof Error) {
          errorMessage = error.message;
          console.log("Error details:", error.name, error.message, error.stack || '');
        } else {
          console.log("Unknown error type:", typeof error, error);
        }

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
        
        // Set the error state to display in UI - clean up any HTML or long error messages
        errorMessage = errorMessage
          .replace(/<\/?[^>]+(>|$)/g, '')  // Remove HTML tags if any
          .replace(/Error Processing PDF: /g, '') // Remove prefix if present
          .trim();
        
        // Set a maximum error message length
        if (errorMessage.length > 150) {
          errorMessage = errorMessage.substring(0, 150) + '...';
        }
        
        setErrorState(errorMessage);

        toast({
          title: "Error Processing PDF",
          description: errorMessage,
          variant: "destructive",
          duration: 5000,
        });
        
        // If the error is related to file format, suggest uploading text instead
        if (
          errorMessage.includes('valid PDF') || 
          errorMessage.includes('could not be processed') ||
          errorMessage.includes('Failed to load PDF') ||
          errorMessage.includes('No text content') ||
          errorMessage.includes('may be scanned')
        ) {
          setTimeout(() => {
            toast({
              title: "Try manual text input",
              description: "You can also manually paste the document text if PDF upload is not working.",
              duration: 8000,
            });
          }, 1000);
        }
      }
    },
    [onContentExtracted, onProgress, onAnalyzing, toast, extractionId, setErrorState]
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

  // Handle custom retry logic
  const handleRetry = useCallback(() => {
    setErrorState(null);
    // Allow retrying the upload
    open();
  }, [open]);

  // Reset error state when new file is dropped
  useEffect(() => {
    if (fileName) {
      setErrorState(null);
    }
  }, [fileName]);

  // Render the upload area with progress indicator
  return (
    <div className="w-full space-y-2">
      {errorState && (
        <Alert variant="destructive" className="mb-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorState}</AlertDescription>
        </Alert>
      )}
      
      <Card
        {...getRootProps()}
        className={`p-2 border border-dashed cursor-pointer transition-colors ${
          isDragActive ? "border-primary bg-primary/5" : "border-border"
        } ${(isLoading || !!extractionId) ? "opacity-70" : ""} ${errorState ? "border-destructive/50" : ""}`}
      >
        <input {...getInputProps()} />
        
        {showProgress ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <FileIcon className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium truncate max-w-[200px]">{fileName}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCancel}
                type="button"
                className="h-6 w-6 p-0"
              >
                <XCircle className="h-4 w-4 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
            <Progress value={progress} className="h-1.5" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="text-[10px]">Processing PDF...</span>
              <span className="text-[10px]">{progress}%</span>
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center gap-1 py-1">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-xs">Processing...</span>
          </div>
        ) : isDragActive ? (
          <div className="flex items-center justify-center gap-1 py-1">
            <FileIcon className="w-4 h-4 text-primary" />
            <span className="text-xs">Drop here</span>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-3 py-2">
            <Upload className="w-6 h-6 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Upload PDF</p>
              <p className="text-xs text-muted-foreground">
                Drag & drop or click to select
              </p>
            </div>
          </div>
        )}
      </Card>
      
      {errorState && (
        <div className="flex justify-center mt-2">
          <Button 
            variant="outline" 
            onClick={handleRetry} 
            size="sm" 
            className="text-xs"
          >
            Try again with a different file
          </Button>
        </div>
      )}
    </div>
  );
}