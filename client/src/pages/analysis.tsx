import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { ConversationThread } from "@/components/conversation-thread";
import { AnalysisTable } from "@/components/analysis-table";

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
  const analysisId = parseInt(location.split('/').pop() || '') || undefined;
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  // Fetch messages when analysisId is available
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery<Message[]>({
    queryKey: ["/api/analysis", analysisId, "messages"],
    enabled: !!analysisId,
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

  if (!analysisId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Your Analyses</h1>
            <Button onClick={() => setLocation("/new-analysis")}>
              New Analysis
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Financial Analyses</CardTitle>
              <CardDescription>View and manage your financial analyses</CardDescription>
            </CardHeader>
            <CardContent>
              <AnalysisTable
                analyses={[]}
                onNewAnalysis={() => setLocation("/new-analysis")}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoadingMessages) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setLocation("/analysis")}
          >
            ← Back to Analysis List
          </Button>
        </div>

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
                disabled={!message.trim() || !analysisId || isSending}
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