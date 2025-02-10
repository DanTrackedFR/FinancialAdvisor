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

export default function Analysis() {
  const [analysisId, setAnalysisId] = useState<number>();
  const [standard, setStandard] = useState<StandardType>("IFRS");
  const [message, setMessage] = useState("");
  const [showNewAnalysis, setShowNewAnalysis] = useState(false);
  const { toast } = useToast();

  // Fetch user's analyses
  const { data: analyses = [], isLoading: isLoadingAnalyses } = useQuery({
    queryKey: ["/api/user/analyses"],
  });

  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
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
        const response = await fetch("/api/analysis", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileName,
            fileContent: content,
            standard,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to start analysis");
        }

        const data = await response.json();
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
      queryClient.invalidateQueries({ queryKey: ["/api/user/analyses"] });
      toast({
        title: "Analysis started",
        description: "Your financial statement is being analyzed",
      });
    },
    onError: (error: any) => {
      console.error("Analysis creation failed:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to start analysis",
        variant: "destructive",
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
        const error = await response.json();
        throw new Error(error.message || "Failed to send message");
      }

      return response.json();
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/analysis", analysisId, "messages"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
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
              onClick={() => setAnalysisId(undefined)}
            >
              ← Back to Analysis
            </Button>
          </div>
          <ConversationThread
            messages={messages}
            isLoading={isLoadingMessages || isSending}
          />
          <div className="flex gap-4">
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
              <CardTitle>Your Analysis</CardTitle>
              <CardDescription>View and manage your financial analyses</CardDescription>
            </CardHeader>
            <CardContent>
              <AnalysisTable 
                analyses={analyses as any[]} 
                onNewAnalysis={() => setShowNewAnalysis(true)}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}