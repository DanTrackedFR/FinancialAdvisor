import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { StandardType } from "@shared/schema";
import { UploadArea } from "@/components/upload-area";
import { StandardSelector } from "@/components/standard-selector";
import { ConversationThread } from "@/components/conversation-thread";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
  const [location, setLocation] = useLocation();
  const [analysisId, setAnalysisId] = useState<number>(
    parseInt(location.split('/').pop() || '') || undefined
  );
  const [standard, setStandard] = useState<StandardType>("IFRS");
  const [message, setMessage] = useState("");
  const [analysisName, setAnalysisName] = useState("");
  const { toast } = useToast();

  // Fetch user's analyses
  const { data: analyses = [], isLoading: isLoadingAnalyses } = useQuery<Analysis[]>({
    queryKey: ["/api/user/analyses"],
  });

  // Fetch messages when analysisId is available
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
      console.log("Starting analysis for:", fileName);

      const response = await fetch("/api/analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: analysisName || fileName, // Use analysis name if provided
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

      const data = await response.json();
      if (!data?.id) {
        throw new Error("Invalid response from server - missing analysis ID");
      }

      return data;
    },
    onSuccess: (data) => {
      console.log("Analysis created successfully:", data);
      setAnalysisId(data.id);
      setLocation(`/analysis/${data.id}`);

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

        {/* Chat Interface */}
        <Card>
          <CardHeader>
            <CardTitle>Analysis Chat</CardTitle>
            <CardDescription>Ask questions about your analysis</CardDescription>
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
                placeholder="Ask a question about the analysis..."
                className="flex-1"
              />
              <Button
                onClick={() => {
                  if (message.trim()) {
                    sendMessage(message);
                  }
                }}
                disabled={!message.trim() || !analysisId}
              >
                Send
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Analysis List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Analyses</CardTitle>
            <CardDescription>View and manage your financial analyses</CardDescription>
          </CardHeader>
          <CardContent>
            <AnalysisTable
              analyses={analyses}
              onNewAnalysis={() => setAnalysisName("")}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}