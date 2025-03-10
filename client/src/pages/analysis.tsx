import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Loader2, Paperclip } from "lucide-react";
import { ConversationThread } from "@/components/conversation-thread";
import { AnalysisTable } from "@/components/analysis-table";
import { UploadArea } from "@/components/upload-area";
import { Analysis } from "@shared/schema";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";
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
  const [showUpload, setShowUpload] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [isLocalUpdate, setIsLocalUpdate] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const initializedRef = useRef(false);

  // Initialize WebSocket connection - keep functionality but remove UI indicators
  const { subscribe, sendMessage: sendWsMessage } = useWebSocket({
    onOpen: () => {
      console.log("WebSocket connected in analysis page");
    },
    onClose: () => {
      console.log("WebSocket disconnected in analysis page");
    },
    onError: (error) => {
      console.error("WebSocket error in analysis page:", error);
    },
    autoReconnect: true
  });

  // Add scroll to top effect
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Subscribe to analysis update messages
  useEffect(() => {
    // Prevent subscribing multiple times on re-renders
    if (!initializedRef.current && analysisId && user) {
      initializedRef.current = true;

      // Subscribe to analysis_update messages for this analysis ID
      const unsubscribe = subscribe('analysis_update', (data: any) => {
        if (data.analysisId === analysisId) {
          // Show notification for status change
          toast({
            title: "Analysis Updated",
            description: `Status changed to: ${data.status}`,
            duration: 5000,
          });

          // Update the UI by invalidating queries
          queryClient.invalidateQueries({ queryKey: ["/api/analysis", analysisId] });
        }
      });

      // Send message to indicate we're viewing this analysis
      sendWsMessage({
        type: 'viewing_analysis',
        analysisId,
        userId: user?.uid
      });

      return () => {
        unsubscribe();
        initializedRef.current = false;
      };
    }

    return () => {}; // Empty cleanup function for cases where we don't subscribe
  }, [analysisId, subscribe, sendWsMessage, user, toast]);

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

  // Sync server messages with local optimistic messages
  useEffect(() => {
    if (!isLocalUpdate && JSON.stringify(messages) !== JSON.stringify(localMessages)) {
      setLocalMessages(messages);
    }
  }, [messages, isLocalUpdate, localMessages]);

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
    onSuccess: (_, newStatus) => {
      queryClient.invalidateQueries({ queryKey: ["/api/analysis", analysisId] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/analyses"] });

      // Send WebSocket message to notify other clients about the status change
      if (user) {
        sendWsMessage({
          type: 'analysis_update',
          analysisId,
          status: newStatus,
          userId: user?.uid
        });
      }

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

  // Debounce function to prevent multiple rapid submissions
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const { mutate: sendMessage, isPending: isSending } = useMutation({
    mutationFn: async (content: string) => {
      if (!analysisId) throw new Error("No active analysis");
      if (!user) throw new Error("You must be logged in to send messages");

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
    onMutate: async (content) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/analysis", analysisId, "messages"] });

      // Create optimistic user message
      const optimisticUserMessage: Message = {
        id: Date.now(),
        role: "user",
        content,
        analysisId: analysisId || -1,
      };

      // Create optimistic AI response
      const optimisticAiMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: "Thinking...",
        analysisId: analysisId || -1,
      };

      // Get current messages from cache
      const previousMessages = queryClient.getQueryData<Message[]>([
        "/api/analysis", analysisId, "messages"
      ]) || [];

      // Add optimistic messages to local state
      setIsLocalUpdate(true);
      setLocalMessages([...previousMessages, optimisticUserMessage, optimisticAiMessage]);
      setMessage("");

      return {
        previousMessages,
        optimisticUserMessage,
        optimisticAiMessage
      };
    },
    onSuccess: (data) => {
      // We don't need to update the cache here, as we'll invalidate
      // the query, which will trigger a refetch with the latest data
      queryClient.invalidateQueries({ queryKey: ["/api/analysis", analysisId, "messages"] });
      setIsLocalUpdate(false);

      // Notify other clients that there's a new message
      if (user) {
        sendWsMessage({
          type: 'new_message',
          analysisId,
          userId: user?.uid
        });
      }
    },
    onError: (error: Error, _, context) => {
      setIsLocalUpdate(false);
      // Revert to previous messages on error
      if (context) {
        setLocalMessages(context.previousMessages);
        queryClient.setQueryData(
          ["/api/analysis", analysisId, "messages"],
          context.previousMessages
        );
      }
      setMessage(_); // Restore the message that failed to send
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

  // Debounced send message to prevent duplicate submissions
  const debouncedSendMessage = useCallback(
    debounce((content: string) => {
      sendMessage(content);
    }, 300),
    [sendMessage]
  );

  const handleSendMessage = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !isSending) {
      debouncedSendMessage(trimmedMessage);
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

      <div className="flex-1 pt-16 pb-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => navigate("/analysis")}
              >
                ← Back to Analysis List
              </Button>

              {/* WebSocket Connection Indicator has been completely removed */}
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
                    Analysis status and details
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
            </Card>

            <Card className="min-h-[calc(100vh-24rem)]">
              <CardHeader>
                <CardTitle>Analysis Chat</CardTitle>
                <CardDescription>Ask questions about your analysis</CardDescription>
              </CardHeader>
              <CardContent className="h-[calc(100vh-32rem)] overflow-y-auto">
                <ConversationThread
                  messages={localMessages}
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
            {showUpload ? (
              <div className="mb-4">
                <UploadArea
                  onContentExtracted={(content) => updateContent(content)}
                  onProgress={setUploadProgress}
                  onAnalyzing={setIsAnalyzing}
                />
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <Progress value={uploadProgress} className="w-full mt-2" />
                )}
                {isAnalyzing && (
                  <div className="flex items-center gap-2 mt-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Analyzing document...</span>
                  </div>
                )}
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={() => setShowUpload(false)}
                >
                  Cancel Upload
                </Button>
              </div>
            ) : (
              <div className="flex gap-4 relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 bottom-2 hover:bg-transparent"
                  onClick={() => setShowUpload(true)}
                >
                  <Paperclip className="h-5 w-5 text-muted-foreground" />
                </Button>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask a question about the analysis..."
                  className="flex-1 pl-12"
                  disabled={isSending}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isSending}
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}