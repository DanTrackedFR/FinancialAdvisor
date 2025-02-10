import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { StandardType } from "@shared/schema";
import { UploadArea } from "@/components/upload-area";
import { StandardSelector } from "@/components/standard-selector";
import { ConversationThread } from "@/components/conversation-thread";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { AnalysisTable } from "@/components/analysis-table";
import { useLocation } from "wouter";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  analysisId: number;
  metadata?: {
    type?: "initial_analysis" | "followup";
  };
}

interface Analysis {
  id: number;
  fileName: string;
  status: string;
  createdAt: string;
}

export default function Analysis() {
  const [, setLocation] = useLocation();
  const [analysisId, setAnalysisId] = useState<number>();
  const [standard, setStandard] = useState<StandardType>("IFRS");
  const [message, setMessage] = useState("");
  const [showNewAnalysis, setShowNewAnalysis] = useState(false);
  const { toast } = useToast();

  // Fetch user's analyses
  const { data: analyses = [], isLoading: isLoadingAnalyses } = useQuery<Analysis[]>({
    queryKey: ["/api/user/analyses"],
  });

  const { data: messages = [], isLoading: isLoadingMessages } = useQuery<Message[]>({
    queryKey: ["/api/analysis", analysisId, "messages"],
    enabled: !!analysisId,
  });

  const { mutate: startAnalysis, isPending: isAnalyzing } = useMutation({
    mutationFn: async ({
      fileName,
      content,
    }: {
      fileName: string;
      content: string;
    }) => {
      console.log("Starting analysis for:", fileName, "with content length:", content.length);
      try {
        const requestBody = {
          fileName,
          fileContent: content,
          standard,
        };
        console.log("Sending request with body:", { fileName, contentLength: content.length, standard });

        const response = await fetch("/api/analysis", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        console.log("Response status:", response.status);
        const responseText = await response.text();
        console.log("Raw response:", responseText);

        if (!response.ok) {
          let errorMessage;
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.error || `Server error: ${response.status}`;
          } catch {
            errorMessage = `Failed to parse error response: ${responseText}`;
          }
          throw new Error(errorMessage);
        }

        let data;
        try {
          data = JSON.parse(responseText);
        } catch {
          throw new Error("Invalid JSON response from server");
        }

        if (!data?.id) {
          console.error("Invalid response data:", data);
          throw new Error("Invalid response from server - missing analysis ID");
        }

        console.log("Analysis created successfully:", data);
        return data;
      } catch (error) {
        console.error("Analysis creation failed:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Setting analysis ID to:", data.id);
      setAnalysisId(data.id);
      setShowNewAnalysis(false);
      setLocation(`/analysis/${data.id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/user/analyses"] });
      toast({
        title: "Analysis started",
        description: "Your financial statement is being analyzed. Please wait while we process it...",
        duration: 5000,
      });
    },
    onError: (error: Error) => {
      console.error("Analysis creation failed:", error);
      toast({
        title: "Error Starting Analysis",
        description: error.message || "Failed to start analysis. Please try again.",
        variant: "destructive",
        duration: 10000,
      });
    },
  });

  const { mutate: sendMessage, isPending: isSending } = useMutation({
    mutationFn: async (content: string) => {
      if (!analysisId) throw new Error("No active analysis");

      const response = await fetch(`/api/analysis/${analysisId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          role: "user",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to parse error response" }));
        throw new Error(errorData.message || "Failed to send message");
      }

      return response.json();
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/analysis", analysisId, "messages"] });
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

  if (isLoadingAnalyses) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (analysisId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => {
                setAnalysisId(undefined);
                setLocation("/analysis");
              }}
            >
              ← Back to Analysis List
            </Button>
          </div>
          <Card>
            <CardContent className="p-6">
              <ConversationThread
                messages={messages}
                isLoading={isLoadingMessages || isSending}
              />
              <div className="flex gap-4 mt-4">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask a question about the analysis..."
                  className="flex-1"
                  disabled={isSending}
                />
                <Button
                  onClick={() => sendMessage(message)}
                  disabled={!message.trim() || isSending}
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {showNewAnalysis ? (
          <Card>
            <CardHeader>
              <CardTitle>New Analysis</CardTitle>
              <CardDescription>Upload a financial statement to analyze</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <StandardSelector
                value={standard}
                onChange={setStandard}
                disabled={isAnalyzing}
              />
              <UploadArea
                onFileProcessed={(fileName, content) => {
                  console.log("File processed, starting analysis...");
                  startAnalysis({ fileName, content });
                }}
                isLoading={isAnalyzing}
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Your Analyses</CardTitle>
              <CardDescription>View and manage your financial analyses</CardDescription>
            </CardHeader>
            <CardContent>
              <AnalysisTable 
                analyses={analyses}
                onNewAnalysis={() => setShowNewAnalysis(true)}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}