import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { StandardType } from "@shared/schema";
import { UploadArea } from "@/components/upload-area";
import { StandardSelector } from "@/components/standard-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

  // Fetch messages when analysisId is available
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
          errorMessage = errorData.error || `Server error: ${response.status}`;
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

      // Invalidate the analyses query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/user/analyses"] });

      toast({
        title: "Analysis Started",
        description: "Your document is being analyzed. Please wait while we process it...",
        duration: 5000,
      });
    },
    onError: (error: Error) => {
      console.error("Analysis creation failed:", error);
      toast({
        title: "Error",
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
                      setAnalysisName(fileName.replace(/\.[^/.]+$/, "")); // Use filename without extension as default name
                    }
                    startAnalysis({ fileName, content });
                  }}
                  isLoading={isAnalyzing}
                />
              </div>
            </div>
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
                placeholder={currentAnalysisId 
                  ? "Ask a question about the analysis..." 
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