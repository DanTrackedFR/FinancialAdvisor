import { useState, useEffect } from "react";
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
import { UploadButton } from "@/components/upload-button";
import { Analysis } from "@shared/schema";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Navigation } from "@/components/navigation";

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
  const [, navigate] = useLocation();
  const location = window.location.pathname;
  const analysisId = parseInt(location.split('/').pop() || '') || undefined;
  const [message, setMessage] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Add scroll to top effect
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch current analysis data
  const { data: currentAnalysis, isLoading: isLoadingAnalysis } = useQuery<Analysis>({
    queryKey: ["/api/analysis", analysisId],
    enabled: !!analysisId && !!user,
    queryFn: async () => {
      if (!analysisId || !user) throw new Error("Missing required data");
      const response = await fetch(`/api/analysis/${analysisId}`, {
        headers: {
          "firebase-uid": user.uid,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch analysis");
      }
      return response.json();
    },
    retry: 1,
  });

  useEffect(() => {
    console.log("Analysis ID:", analysisId);
    console.log("Current analysis:", currentAnalysis);
  }, [analysisId, currentAnalysis]);

  // Fetch user's analyses for the list view
  const { data: analyses = [], isLoading: isLoadingAnalyses } = useQuery<Analysis[]>({
    queryKey: ["/api/user/analyses"],
    enabled: !!user,
  });

  // Fetch messages when analysisId is available
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery<Message[]>({
    queryKey: ["/api/analysis", analysisId, "messages"],
    enabled: !!analysisId && !!user,
    queryFn: async () => {
      if (!analysisId || !user) throw new Error("Missing required data");
      const response = await fetch(`/api/analysis/${analysisId}/messages`, {
        headers: {
          "firebase-uid": user.uid,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }
      return response.json();
    },
  });

  // Add debug logging for messages
  useEffect(() => {
    console.log("Current analysisId:", analysisId);
    console.log("Messages loaded:", messages);
  }, [analysisId, messages]);


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

  const { mutate: updateStatus } = useMutation({
    mutationFn: async (newStatus: string) => {
      if (!analysisId || !user) throw new Error("Missing required data");

      const response = await fetch(`/api/analysis/${analysisId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "firebase-uid": user.uid,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/analysis", analysisId] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/analyses"] });
      toast({
        title: "Status Updated",
        description: "Analysis status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const { mutate: sendMessage, isPending: isSending } = useMutation({
    mutationFn: async (content: string) => {
      if (!analysisId) throw new Error("No active analysis");
      if (!user) throw new Error("You must be logged in to send messages");

      console.log("Sending message to analysis:", analysisId);
      const response = await fetch(`/api/analysis/${analysisId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "firebase-uid": user.uid,
        },
        body: JSON.stringify({
          content,
          role: "user",
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
    onSuccess: () => {
      setMessage("");
      console.log("Invalidating messages query for analysis:", analysisId);
      queryClient.invalidateQueries({ queryKey: ["/api/analysis", analysisId, "messages"] });
    },
    onError: (error: Error) => {
      console.error("Error sending message:", error);
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

  const handleContentExtracted = async (content: string) => {
    if (!analysisId) return;

    updateContent(content);

    try {
      const response = await fetch(`/api/analysis/${analysisId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "firebase-uid": user?.uid || "",
        },
        body: JSON.stringify({
          content: "Document uploaded for analysis. Please confirm you can access the content.",
          role: "user",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process document");
      }

      queryClient.invalidateQueries({ queryKey: ["/api/analysis", analysisId, "messages"] });
    } catch (error) {
      toast({
        title: "Error Processing Document",
        description: "Failed to process the document. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!analysisId) {
    if (isLoadingAnalyses) {
      return (
        <div className="flex flex-col min-h-screen">
          <div className="fixed top-0 left-0 right-0 z-50 border-b bg-background">
            <Navigation />
          </div>
          <div className="flex items-center justify-center flex-1 pt-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col min-h-screen">
        <div className="fixed top-0 left-0 right-0 z-50 border-b bg-background">
          <Navigation />
        </div>
        <div className="container mx-auto px-4 py-8 pt-16">
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
      </div>
    );
  }

  if (isLoadingMessages || isLoadingAnalysis) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="fixed top-0 left-0 right-0 z-50 border-b bg-background">
          <Navigation />
        </div>
        <div className="flex items-center justify-center flex-1 pt-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="fixed top-0 left-0 right-0 z-50 border-b bg-background">
        <Navigation />
      </div>

      <div className="flex-1 pt-16 pb-[180px]">
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

            <Card className="sticky top-[80px] z-40 bg-background">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle>
                    {isLoadingAnalysis ? (
                      <div className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </div>
                    ) : (
                      currentAnalysis?.fileName || "Untitled Analysis"
                    )}
                  </CardTitle>
                  <CardDescription>
                    Upload additional documents or update content
                  </CardDescription>
                </div>
                {currentAnalysis && (
                  <Select
                    value={currentAnalysis.status}
                    onValueChange={(value) => updateStatus(value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Drafting">Drafting</SelectItem>
                      <SelectItem value="In Review">In Review</SelectItem>
                      <SelectItem value="Complete">Complete</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Removed UploadArea */}
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

            <Card className="min-h-[calc(100vh-24rem)]">
              <CardHeader>
                <CardTitle>Analysis Chat</CardTitle>
                <CardDescription>Ask questions about your analysis</CardDescription>
              </CardHeader>
              <CardContent className="h-[calc(100vh-32rem)] overflow-y-auto">
                <ConversationThread
                  messages={messages}
                  isLoading={isLoadingMessages}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Fixed Input Area */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex gap-4 items-center">
              <UploadButton
                onContentExtracted={handleContentExtracted}
                onProgress={setUploadProgress}
                onAnalyzing={setIsAnalyzing}
              />
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
            {isAnalyzing && (
              <div className="flex items-center gap-2 mt-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Analyzing document...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}