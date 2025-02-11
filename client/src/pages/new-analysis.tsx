import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { StandardType } from "@shared/schema";
import { UploadArea } from "@/components/upload-area";
import { StandardSelector } from "@/components/standard-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { ConversationThread } from "@/components/conversation-thread";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  analysisId: number;
  metadata?: {
    type?: "initial_analysis" | "followup";
  };
}

export default function NewAnalysis() {
  const [, setLocation] = useLocation();
  const [standard, setStandard] = useState<StandardType>("IFRS");
  const [analysisName, setAnalysisName] = useState("");
  const [message, setMessage] = useState("");
  const [currentAnalysisId, setCurrentAnalysisId] = useState<number | null>(null);
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);

  const { data: messages = [], isLoading: isLoadingMessages } = useQuery<Message[]>({
    queryKey: ["/api/analysis", currentAnalysisId, "messages"],
    enabled: !!currentAnalysisId,
  });

  const { mutate: startAnalysis, isPending: isAnalyzing } = useMutation({
    mutationFn: async ({
      fileName,
      content,
    }: {
      fileName: string;
      content: string;
    }) => {
      if (!user) {
        throw new Error("You must be logged in to create an analysis");
      }

      const response = await fetch("/api/analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "firebase-uid": user.uid
        },
        body: JSON.stringify({
          fileName: analysisName || fileName,
          fileContent: content,
          standard,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        let errorMessage;
        try {
          const errorData = JSON.parse(text);
          if (errorData.error && errorData.error.includes("rate limit exceeded")) {
            errorMessage = "The analysis service is currently busy. Please wait a few minutes and try again.";
          } else {
            errorMessage = errorData.error || `Server error: ${response.status}`;
          }
        } catch {
          errorMessage = `Failed to parse error response: ${text}`;
        }
        throw new Error(errorMessage);
      }

      return response.json();
    },
    onSuccess: (data) => {
      console.log("Analysis created successfully:", data);
      setCurrentAnalysisId(data.id);
      setShowProgress(true);
      setProgress(0);
      setAnalysisComplete(false);

      queryClient.invalidateQueries({ queryKey: ["/api/user/analyses"] });

      toast({
        title: "Analysis Started",
        description: "Your document is being analyzed. Please wait while we process it...",
        duration: 5000,
      });

      let progressTimer: NodeJS.Timeout | null = null;
      let statusInterval: NodeJS.Timeout | null = null;
      let initialCheckTimeout: NodeJS.Timeout | null = null;

      // Progress tracking with smoother progression and bounds checking
      progressTimer = setInterval(() => {
        setProgress((prev) => {
          if (analysisComplete) {
            if (progressTimer) clearInterval(progressTimer);
            return 100;
          }
          if (prev >= 85) return Math.min(85 + 0.5, 90); // Cap at 90% until complete
          return Math.min(85, prev + 2);
        });
      }, 1000);

      // Status checking function
      const checkAnalysisStatus = async () => {
        if (analysisComplete) return true;

        try {
          // Force a fresh fetch
          await queryClient.invalidateQueries({ 
            queryKey: ["/api/analysis", data.id, "messages"]
          });

          // Try to fetch messages with error handling
          let messages;
          try {
            messages = await queryClient.fetchQuery({
              queryKey: ["/api/analysis", data.id, "messages"],
              staleTime: 0,
            });
          } catch (fetchError: any) {
            console.error("Failed to fetch messages:", fetchError);
            // Check if we got HTML instead of JSON
            if (fetchError.message?.includes("<!DOCTYPE")) {
              throw new Error("Server returned HTML instead of JSON. The server might be restarting.");
            }
            throw fetchError;
          }

          if (Array.isArray(messages) && messages.length > 0) {
            console.log("Analysis completion detected!");
            setAnalysisComplete(true);

            // Clear all intervals and timeouts
            if (progressTimer) clearInterval(progressTimer);
            if (statusInterval) clearInterval(statusInterval);
            if (initialCheckTimeout) clearTimeout(initialCheckTimeout);

            setProgress(100);

            // Small delay before hiding progress
            setTimeout(() => {
              setShowProgress(false);
            }, 1000);

            toast({
              title: "✅ Analysis Complete",
              description: "Your document has been analyzed successfully! You can now start asking questions about your financial statement.",
              duration: 10000,
              variant: "default",
              className: "bg-green-50 border-green-200",
            });

            return true;
          }
          return false;
        } catch (error: any) {
          console.error("Error checking analysis status:", error);

          if (error.message?.includes("API key") || error.message?.includes("Server returned HTML")) {
            // Clear all intervals and timeouts
            if (progressTimer) clearInterval(progressTimer);
            if (statusInterval) clearInterval(statusInterval);
            if (initialCheckTimeout) clearTimeout(initialCheckTimeout);

            setProgress(0);
            setShowProgress(false);
            setAnalysisComplete(false);

            toast({
              title: "Analysis Error",
              description: error.message.includes("API key") 
                ? "API configuration error. Please try again later."
                : "Server error. Please try again in a few moments.",
              variant: "destructive",
              duration: 10000,
            });
            throw error;
          }
          return false;
        }
      };

      let statusCheckCount = 0;
      const maxStatusChecks = 150; // 5 minutes with 2-second intervals

      // Initial check after 2 seconds
      initialCheckTimeout = setTimeout(async () => {
        try {
          const isComplete = await checkAnalysisStatus();
          if (!isComplete) {
            // Start periodic checking
            statusInterval = setInterval(async () => {
              try {
                statusCheckCount++;
                const isComplete = await checkAnalysisStatus();
                if (isComplete || statusCheckCount >= maxStatusChecks) {
                  if (statusInterval) clearInterval(statusInterval);
                  if (statusCheckCount >= maxStatusChecks && !isComplete) {
                    if (progressTimer) clearInterval(progressTimer);
                    setProgress(0);
                    setShowProgress(false);
                    setAnalysisComplete(false);
                    toast({
                      title: "Analysis Timeout",
                      description: "The analysis is taking longer than expected. Please try again.",
                      variant: "destructive",
                      duration: 10000,
                    });
                  }
                }
              } catch (error) {
                if (statusInterval) clearInterval(statusInterval);
                console.error("Status check failed:", error);
              }
            }, 2000);
          }
        } catch (error) {
          console.error("Initial status check failed:", error);
        }
      }, 2000);

      // Cleanup function
      return () => {
        if (progressTimer) clearInterval(progressTimer);
        if (statusInterval) clearInterval(statusInterval);
        if (initialCheckTimeout) clearTimeout(initialCheckTimeout);
      };
    },
    onError: (error: Error) => {
      console.error("Analysis creation failed:", error);
      setShowProgress(false);
      setProgress(0);
      setAnalysisComplete(false);
      toast({
        title: "Analysis Error",
        description: error.message,
        variant: "destructive",
        duration: 10000,
      });
    },
  });

  const { mutate: sendMessage, isPending: isSending } = useMutation({
    mutationFn: async (content: string) => {
      if (!currentAnalysisId) throw new Error("No active analysis");

      return apiRequest("POST", `/api/analysis/${currentAnalysisId}/messages`, {
        content,
        role: "user",
      });
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/analysis", currentAnalysisId, "messages"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Sending Message",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.altKey) {
        const textarea = e.currentTarget;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;

        setMessage(
          value.substring(0, start) + '\n' + value.substring(end)
        );

        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 1;
        }, 0);

        e.preventDefault();
      } else if (!e.shiftKey) {
        e.preventDefault();
        if (message.trim() && !isSending) {
          const currentMessage = message;
          setMessage("");
          sendMessage(currentMessage);
        }
      }
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to create a new analysis.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>New Analysis</CardTitle>
            <CardDescription>Upload a financial statement to analyze</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input
                  placeholder="Enter Analysis Name"
                  value={analysisName}
                  onChange={(e) => setAnalysisName(e.target.value)}
                  className="mb-4"
                />
                <StandardSelector
                  value={standard}
                  onChange={setStandard}
                  disabled={isAnalyzing}
                />
              </div>
              <div>
                <UploadArea
                  onFileProcessed={(fileName, content) => {
                    console.log("File processed, starting analysis...");
                    if (!analysisName) {
                      setAnalysisName(fileName.replace(/\.[^/.]+$/, ""));
                    }
                    startAnalysis({ fileName, content });
                  }}
                  isLoading={isAnalyzing}
                />
              </div>
            </div>
            {showProgress && (
              <div className="space-y-2">
                <div className="text-sm font-medium">
                  Analyzing document... {Math.round(progress)}%
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Analysis Chat</CardTitle>
            <CardDescription>
              {currentAnalysisId
                ? "Ask questions about your analysis"
                : "Upload a document to start the analysis. The AI will begin analyzing your document here."}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <ConversationThread
              messages={messages}
              isLoading={isLoadingMessages}
            />
            <div className="flex gap-4 mt-4">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={currentAnalysisId
                  ? "Ask a question about the analysis... (Press Enter to send, Alt+Enter for new line)"
                  : "Please upload a document first to start the conversation"}
                className="flex-1"
                disabled={!currentAnalysisId}
              />
              <Button
                onClick={() => {
                  if (message.trim()) {
                    sendMessage(message);
                  }
                }}
                disabled={!currentAnalysisId || !message.trim() || isSending}
              >
                Send
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}