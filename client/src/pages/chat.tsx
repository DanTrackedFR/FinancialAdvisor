import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Paperclip } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { ConversationThread } from "@/components/conversation-thread";
import { queryClient } from "@/lib/queryClient";
import { Navigation } from "@/components/navigation";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  analysisId: number;
}

export default function ChatPage() {
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [message, setMessage] = useState("");

  const { data: messages = [] } = useQuery({
    queryKey: ["chat-messages"],
    queryFn: async () => {
      const storedMessages = queryClient.getQueryData<Message[]>(["chat-messages"]) || [];
      return storedMessages;
    },
    staleTime: Infinity,
    gcTime: Infinity,
    initialData: [],
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

      const previousMessages = queryClient.getQueryData<Message[]>(["chat-messages"]) || [];
      queryClient.setQueryData(["chat-messages"], [...previousMessages, optimisticUserMessage]);

      setMessage("");
      return { optimisticUserMessage, previousMessages };
    },
    onSuccess: (data) => {
      if (Array.isArray(data) && data.length > 0) {
        const previousMessages = queryClient.getQueryData<Message[]>(["chat-messages"]) || [];
        queryClient.setQueryData(
          ["chat-messages"],
          [...previousMessages.slice(0, -1), ...data]
        );
      }
    },
    onError: (error: Error, _, context) => {
      if (context) {
        queryClient.setQueryData(["chat-messages"], context.previousMessages);
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
        const cursorPosition = e.currentTarget.selectionStart;
        const textBeforeCursor = message.slice(0, cursorPosition);
        const textAfterCursor = message.slice(cursorPosition);
        setMessage(textBeforeCursor + '\n' + textAfterCursor);
        e.preventDefault();
      } else if (!e.shiftKey) {
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

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="fixed top-0 left-0 right-0 z-50 border-b bg-background">
          <Navigation />
        </div>
        <div className="container mx-auto px-4 py-8 pt-16">
          <Card className="p-6">
            <p className="text-center">Please log in to use the chat.</p>
          </Card>
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
          <div className="max-w-6xl mx-auto">
            <ConversationThread
              messages={messages}
              isLoading={isSending}
            />
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex gap-4 relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 bottom-2 hover:bg-transparent"
                onClick={() => {
                  // TODO: Implement attachment functionality
                  toast({
                    title: "Coming Soon",
                    description: "Attachment functionality will be available soon!",
                  });
                }}
              >
                <Paperclip className="h-5 w-5 text-muted-foreground" />
              </Button>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message... (Press Enter to send, Alt+Enter for new line)"
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
          </div>
        </div>
      </div>
    </div>
  );
}