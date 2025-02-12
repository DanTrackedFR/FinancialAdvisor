import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { ConversationThread } from "@/components/conversation-thread";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { StandardSelector } from "@/components/standard-selector";
import { UploadArea } from "@/components/upload-area";
import { queryClient } from "@/lib/queryClient";
import type { StandardType } from "@shared/schema";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  analysisId: number;
}

export default function NewAnalysis() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [analysisName, setAnalysisName] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [standard, setStandard] = useState<StandardType>("IFRS");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Pre-initialize the general chat
  useEffect(() => {
    if (user) {
      fetch('/api/chat/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'firebase-uid': user.uid
        }
      }).catch(error => {
        console.error('Failed to initialize chat:', error);
      });
    }
  }, [user]);

  const { mutate: createAnalysis, isPending: isCreatingAnalysis } = useMutation({
    mutationFn: async () => {
      if (!analysisName || !fileContent) {
        throw new Error("Please provide both a name and upload a document");
      }

      const response = await fetch('/api/analysis', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "firebase-uid": user?.uid || "",
        },
        body: JSON.stringify({
          fileName: analysisName,
          fileContent,
          standard,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create analysis");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/analysis"] });
      toast({
        title: "Analysis Created",
        description: "Your analysis has been created successfully.",
      });
      setLocation("/analysis");
    },
    onError: (error: Error) => {
      toast({
        title: "Error Creating Analysis",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { mutate: sendMessage, isPending: isSending } = useMutation({
    mutationFn: async (content: string) => {
      if (!user) {
        throw new Error("You must be logged in to chat");
      }

      const response = await fetch('/api/chat', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "firebase-uid": user.uid
        },
        body: JSON.stringify({ message: content }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send message");
      }

      return response.json();
    },
    onMutate: async (newMessage) => {
      const optimisticUserMessage = {
        id: Date.now(),
        role: "user" as const,
        content: newMessage,
        analysisId: -1,
      };
      setMessages(prev => [...prev, optimisticUserMessage]);
      setMessage("");
      return { optimisticUserMessage };
    },
    onSuccess: (data) => {
      if (Array.isArray(data) && data.length > 0) {
        setMessages(prevMessages => 
          [...prevMessages.slice(0, -1), ...data]
        );
      }
    },
    onError: (error: Error, _, context) => {
      if (context?.optimisticUserMessage) {
        setMessages(prev => 
          prev.filter(msg => msg.id !== context.optimisticUserMessage.id)
        );
      }
      setMessage(context?.optimisticUserMessage.content || "");
      toast({
        title: "Error Sending Message",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    }
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
            <CardDescription>Please log in to use this feature.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 container mx-auto px-4 pb-24">
        <div className="max-w-6xl mx-auto py-8">
          {/* Analysis Creation Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>New Financial Analysis</CardTitle>
              <CardDescription>
                Upload a document and provide details for analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Input
                    placeholder="Analysis Name"
                    value={analysisName}
                    onChange={(e) => setAnalysisName(e.target.value)}
                  />
                </div>
                <div>
                  <StandardSelector
                    value={standard}
                    onChange={(value) => setStandard(value)}
                  />
                </div>
                <div>
                  <UploadArea
                    onContentExtracted={(content) => setFileContent(content)}
                    onProgress={setUploadProgress}
                    onAnalyzing={setIsAnalyzing}
                  />
                </div>
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <Progress value={uploadProgress} className="w-full" />
                )}
                {isAnalyzing && (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Analyzing document...</span>
                  </div>
                )}
                <Button
                  onClick={() => createAnalysis()}
                  disabled={!analysisName || !fileContent || isCreatingAnalysis}
                >
                  {isCreatingAnalysis ? (
                    <div className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Analysis...
                    </div>
                  ) : (
                    'Create Analysis'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Chat Card */}
          <Card className="min-h-[calc(100vh-16rem)]">
            <CardHeader>
              <CardTitle>Finance AI Chat</CardTitle>
              <CardDescription>
                Chat with our AI about any financial topic
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[calc(100vh-24rem)] overflow-y-auto">
              <ConversationThread
                messages={messages}
                isLoading={isSending}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t bg-background py-4">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex gap-4">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message... (Press Enter to send, Alt+Enter for new line)"
                className="flex-1"
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
          </div>
        </div>
      </div>
    </div>
  );
}