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
import { UploadArea } from "@/components/upload-area";
import { Analysis } from "@shared/schema";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  analysisId: number;
  metadata?: {
    type?: "initial_analysis" | "followup";
  };
}

export default function AnalysisPage() {
  const [location, navigate] = useLocation();
  const analysisId = parseInt(location.split('/').pop() || '') || undefined;
  const [message, setMessage] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch current analysis data
  const { data: currentAnalysis, isLoading: isLoadingAnalysis } = useQuery<Analysis>({
    queryKey: ["/api/analysis", analysisId],
    enabled: !!analysisId && !!user,
    retry: 1,
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to load analysis. Please try again.",
        variant: "destructive",
      });
      console.error("Error loading analysis:", error);
    }
  });

  // Fetch user's analyses for the list view
  const { data: analyses = [], isLoading: isLoadingAnalyses } = useQuery<Analysis[]>({
    queryKey: ["/api/user/analyses"],
    enabled: !!user,
  });

  // Fetch messages when analysisId is available
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery<Message[]>({
    queryKey: ["/api/analysis", analysisId, "messages"],
    enabled: !!analysisId && !!user,
  });

  const { mutate: updateContent } = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/analysis/${analysisId}/content`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "firebase-uid": user?.uid || "",
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error("Failed to update content");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/analysis", analysisId] });
      toast({
        title: "Content Updated",
        description: "Analysis content has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update content. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.altKey) {
        // Alt+Enter: Insert a new line
        const cursorPosition = e.currentTarget.selectionStart;
        const textBeforeCursor = message.slice(0, cursorPosition);
        const textAfterCursor = message.slice(cursorPosition);
        setMessage(textBeforeCursor + '\n' + textAfterCursor);
        // Prevent default to avoid sending
        e.preventDefault();
      } else if (!e.shiftKey) {
        // Regular Enter (not Shift+Enter): Send message
        e.preventDefault();
        handleSendMessage();
      }
    }
  };

  const handleSendMessage = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !isSending) {
      sendMessage(trimmedMessage);
    }
  };

  if (!analysisId) {
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
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Your Analyses</h1>
            <Button onClick={() => navigate("/new-analysis")}>
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
                analyses={analyses}
                onNewAnalysis={() => navigate("/new-analysis")}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoadingMessages || isLoadingAnalysis) {
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
            onClick={() => navigate("/analysis")}
          >
            ← Back to Analysis List
          </Button>
        </div>

        {/* Title and Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>{isLoadingAnalysis ? "Loading..." : (currentAnalysis?.fileName || "Untitled Analysis")}</CardTitle>
            <CardDescription>
              Upload additional documents or update content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <UploadArea
              onContentExtracted={(content) => updateContent(content)}
              onProgress={setUploadProgress}
              onAnalyzing={setIsAnalyzing}
            />
            {uploadProgress > 0 && uploadProgress < 100 && (
              <Progress value={uploadProgress} className="w-full" />
            )}
            {isAnalyzing && (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Analyzing document...</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat Section */}
        <Card className="min-h-[calc(100vh-16rem)]">
          <CardHeader>
            <CardTitle>Analysis Chat</CardTitle>
            <CardDescription>Ask questions about your analysis</CardDescription>
          </CardHeader>
          <CardContent className="h-[calc(100vh-24rem)] overflow-y-auto">
            <ConversationThread
              messages={messages}
              isLoading={isLoadingMessages}
            />
          </CardContent>
        </Card>

        {/* Chat Input */}
        <div className="fixed bottom-0 left-0 right-0 border-t bg-background py-4">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="flex gap-4">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask a question about the analysis..."
                  className="flex-1"
                  disabled={isSending}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || !analysisId || isSending}
                  className={`bg-blue-600 hover:bg-blue-700 text-white ${(!message.trim() || isSending) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSending ? (
                    <div className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </div>
                  ) : (
                    'Send'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}