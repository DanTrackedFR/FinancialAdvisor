import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { ConversationThread } from "@/components/conversation-thread";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  analysisId: number;
  metadata?: {
    type?: "initial_analysis" | "followup" | "chat";
  };
}

export default function NewAnalysis() {
  const [, setLocation] = useLocation();
  const [message, setMessage] = useState("");
  const [currentAnalysisId, setCurrentAnalysisId] = useState<number | null>(null);
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();

  // Query for fetching messages with optimistic updates
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery<Message[]>({
    queryKey: ["/api/analysis", currentAnalysisId, "messages"],
    enabled: true,
    refetchInterval: 3000, // Poll every 3 seconds for new messages
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
      await queryClient.cancelQueries({ queryKey: ["/api/analysis", currentAnalysisId, "messages"] });

      const optimisticMessage = {
        id: Date.now(),
        role: "user" as const,
        content: newMessage,
        analysisId: currentAnalysisId || -1,
      };

      queryClient.setQueryData<Message[]>(["/api/analysis", currentAnalysisId, "messages"], 
        (old = []) => [...old, optimisticMessage]
      );

      return { optimisticMessage };
    },
    onSuccess: (data) => {
      setMessage("");
      if (Array.isArray(data) && data.length > 0) {
        setCurrentAnalysisId(data[0].analysisId);
        // Force refetch to get the AI response
        queryClient.invalidateQueries({ queryKey: ["/api/analysis", data[0].analysisId, "messages"] });
      }
    },
    onError: (error: Error, _, context) => {
      if (context?.optimisticMessage) {
        queryClient.setQueryData<Message[]>(
          ["/api/analysis", currentAnalysisId, "messages"],
          (old = []) => old.filter(msg => msg.id !== context.optimisticMessage.id)
        );
      }

      toast({
        title: "Error Sending Message",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    }
  });

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (message.trim() && !isSending) {
        sendMessage(message);
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
            <CardDescription>Please log in to use the chat.</CardDescription>
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
            <CardTitle>Financial AI Chat</CardTitle>
            <CardDescription>
              Chat with our AI about financial topics
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <ConversationThread
              messages={messages}
              isLoading={isLoadingMessages || isSending}
            />
            <div className="flex gap-4 mt-4">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message... (Press Enter to send)"
                className="flex-1"
                disabled={isSending}
              />
              <Button
                onClick={() => {
                  if (message.trim() && !isSending) {
                    sendMessage(message);
                  }
                }}
                disabled={!message.trim() || isSending}
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}