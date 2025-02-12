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

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  analysisId: number;
}

export default function NewAnalysis() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();

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
        if (message.trim() && !isSending) {
          sendMessage(message);
        }
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
              isLoading={isSending}
            />
            <div className="flex gap-4 mt-4">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message... (Press Enter to send, Alt+Enter for new line)"
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}