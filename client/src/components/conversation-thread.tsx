import { Avatar } from "./ui/avatar";
import { Card } from "./ui/card";
import { Bot, User } from "lucide-react";
import { useEffect, useRef } from "react";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  analysisId: number;
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <Card
          key={message.id}
          className={`p-4 ${
            message.role === "assistant"
              ? "bg-primary/5 border-primary/20"
              : ""
          }`}
        >
          <div className="flex gap-4">
            <Avatar className="h-8 w-8">
              {message.role === "assistant" ? (
                <Bot className="h-4 w-4" />
              ) : (
                <User className="h-4 w-4" />
              )}
            </Avatar>
            <div className="flex-1">
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        </Card>
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