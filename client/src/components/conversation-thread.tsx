import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Card } from "./ui/card";
import { Bot } from "lucide-react";
import { useEffect, useRef } from "react";
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

interface ConversationThreadProps {
  messages: Message[];
  isLoading?: boolean;
}

export function ConversationThread({
  messages,
  isLoading,
}: ConversationThreadProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div key={message.id} className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"}`}>
          <Card
            className={`p-4 max-w-[80%] ${
              message.role === "assistant"
                ? "bg-primary/5 border-primary/20"
                : "bg-secondary"
            }`}
          >
            <div className={`flex gap-4 ${message.role === "user" ? "flex-row-reverse" : ""}`}>
              {message.role === "assistant" && (
                <Avatar className="h-8 w-8">
                  <AvatarImage 
                    src="/assets/tracked-ai-logo.jpg" 
                    alt="TrackedFR AI"
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-primary">
                    <Bot className="h-4 w-4 text-white" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="flex-1">
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          </Card>
        </div>
      ))}
      {isLoading && (
        <Card className="p-4 animate-pulse">
          <div className="flex gap-4">
            <div className="h-8 w-8 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          </div>
        </Card>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}