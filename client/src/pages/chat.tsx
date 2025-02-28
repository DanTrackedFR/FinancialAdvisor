import { useState, useEffect, useCallback, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Paperclip, WifiOff, Wifi } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { ConversationThread } from "@/components/conversation-thread";
import { queryClient } from "@/lib/queryClient";
import { Navigation } from "@/components/navigation";
import { UploadArea } from "@/components/upload-area";
import { Progress } from "@/components/ui/progress";
import { useWebSocket } from "@/hooks/use-websocket";

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
  const [showUpload, setShowUpload] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [isLocalUpdate, setIsLocalUpdate] = useState(false);
  const initializedRef = useRef(false);

  // Initialize WebSocket connection
  const { 
    isConnected, 
    subscribe, 
    sendMessage: sendWsMessage,
    getConnectionStatus,
    connectionDetails
  } = useWebSocket({
    onOpen: () => {
      console.log("WebSocket connected in chat page");
      toast({
        title: "Real-time updates activated",
        description: "You will now receive live updates",
        duration: 3000,
      });
    },
    onClose: () => {
      console.log("WebSocket disconnected in chat page");
      toast({
        title: "Real-time updates disconnected",
        description: "Attempting to reconnect...",
        variant: "destructive",
        duration: 5000,
      });
    },
    onError: (error) => {
      console.error("WebSocket error in chat page:", error);
    },
    autoReconnect: true
  });

  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ["chat-messages"],
    queryFn: async () => {
      const storedMessages = queryClient.getQueryData<Message[]>(["chat-messages"]) || [];
      return storedMessages;
    },
    staleTime: Infinity,
    gcTime: Infinity,
    initialData: [],
  });

  // Sync server messages with local optimistic messages
  useEffect(() => {
    if (!isLocalUpdate) {
      setLocalMessages(messages);
    }
  }, [messages, isLocalUpdate]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Set up WebSocket subscription for chat updates
  useEffect(() => {
    // Prevent subscribing multiple times on re-renders
    if (!initializedRef.current && isConnected && user) {
      initializedRef.current = true;
      console.log("Setting up WebSocket subscription for chat updates");

      // Listen for chat messages
      const unsubscribe = subscribe('chat', (data: any) => {
        console.log("Received chat message via WebSocket:", data);
        if (data.userId !== user.uid) {
          // Show notification for new chat message
          toast({
            title: "New Message",
            description: "You have a new message in the chat",
            duration: 3000,
          });
        }
      });

      return () => {
        console.log("Cleaning up WebSocket subscription");
        unsubscribe();
        initializedRef.current = false;
      };
    }

    return () => {}; // Empty cleanup function for cases where we don't subscribe
  }, [isConnected, user, subscribe, toast]);

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

  const handleContentExtracted = async (content: string) => {
    try {
      if (!user) throw new Error("You must be logged in to chat");

      // Show optimistic message
      const optimisticUserMessage = {
        id: Date.now(),
        role: "user" as const,
        content: "Document uploaded for analysis. Please confirm you can access the content.",
        analysisId: -1,
      };

      const optimisticAiMessage = {
        id: Date.now() + 1,
        role: "assistant" as const,
        content: "Processing your document...",
        analysisId: -1,
      };

      setIsLocalUpdate(true);
      setLocalMessages(prev => [...prev, optimisticUserMessage, optimisticAiMessage]);

      const response = await fetch('/api/chat', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "firebase-uid": user.uid
        },
        body: JSON.stringify({ 
          message: "Document uploaded for analysis. Please confirm you can access the content.",
          fileContent: content 
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process document");
      }

      const result = await response.json();
      if (Array.isArray(result) && result.length > 0) {
        // Replace the optimistic messages with actual response
        setLocalMessages(prev => [...prev.slice(0, prev.length - 2), ...result]);
        queryClient.setQueryData(["chat-messages"], 
          [...(queryClient.getQueryData<Message[]>(["chat-messages"]) || []), ...result]
        );

        // Notify via WebSocket that a new message is available
        if (isConnected && user) {
          sendWsMessage({
            type: 'chat',
            userId: user.uid,
            message: 'New document uploaded for analysis'
          });
        }
      }

      setIsLocalUpdate(false);
      setShowUpload(false);
    } catch (error: any) {
      setIsLocalUpdate(false);
      toast({
        title: "Error Processing Document",
        description: error.message || "Failed to process the document. Please try again.",
        variant: "destructive",
      });
    }
  };

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

      const optimisticAiMessage = {
        id: Date.now() + 1,
        role: "assistant" as const,
        content: "Thinking...",
        analysisId: -1,
      };

      setIsLocalUpdate(true);
      setLocalMessages(prev => [...prev, optimisticUserMessage, optimisticAiMessage]);
      setMessage("");

      return { 
        optimisticUserMessage, 
        optimisticAiMessage,
        previousMessages: queryClient.getQueryData<Message[]>(["chat-messages"]) || []
      };
    },
    onSuccess: (data, _, context) => {
      if (Array.isArray(data) && data.length > 0) {
        // Replace the optimistic messages with actual response
        setLocalMessages(prev => {
          const withoutOptimistic = prev.slice(0, prev.length - 2);
          return [...withoutOptimistic, ...data];
        });

        queryClient.setQueryData(
          ["chat-messages"],
          [...context!.previousMessages, ...data]
        );

        // Notify via WebSocket that a new message is available
        if (isConnected && user) {
          sendWsMessage({
            type: 'chat',
            userId: user.uid,
            message: 'New chat message'
          });
        }
      }
      setIsLocalUpdate(false);
    },
    onError: (error: Error, _, context) => {
      setIsLocalUpdate(false);
      if (context) {
        // Remove the optimistic messages on error
        setLocalMessages(prev => 
          prev.filter(msg => 
            msg.id !== context.optimisticUserMessage.id && 
            msg.id !== context.optimisticAiMessage.id
          )
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
            {/* WebSocket Connection Indicator - Made more prominent */}
            <div className="flex items-center justify-end gap-2 mb-4 p-2 border rounded-lg">
              {isConnected ? (
                <>
                  <Wifi className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-green-500">
                    Live updates active
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="w-5 h-5 text-red-500" />
                  <span className="text-sm font-medium text-red-500">
                    {getConnectionStatus() === "connecting" 
                      ? "Connecting..." 
                      : "Disconnected - Updates paused"}
                  </span>
                </>
              )}
              <span className="text-xs text-muted-foreground ml-2">
                ({connectionDetails.attempts} attempts)
              </span>
            </div>

            <ConversationThread
              messages={localMessages}
              isLoading={isSending || isLoadingMessages}
            />
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-6xl mx-auto">
            {showUpload ? (
              <div className="mb-4">
                <UploadArea
                  onContentExtracted={handleContentExtracted}
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}