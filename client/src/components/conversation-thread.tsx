import { Message } from "@shared/schema";
import { Avatar } from "./ui/avatar";
import { Card } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Bot, User } from "lucide-react";

interface ConversationThreadProps {
  messages: Message[];
  isLoading?: boolean;
}

export function ConversationThread({
  messages,
  isLoading,
}: ConversationThreadProps) {
  return (
    <ScrollArea className="h-[600px] pr-4">
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
                {message.metadata ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium">Summary</h3>
                      <p>{message.metadata.summary}</p>
                    </div>
                    <div>
                      <h3 className="font-medium">Review Points</h3>
                      <ul className="list-disc pl-4">
                        {message.metadata.reviewPoints.map((point, i) => (
                          <li key={i}>{point}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-medium">Suggested Improvements</h3>
                      <ul className="list-disc pl-4">
                        {message.metadata.improvements.map((improvement, i) => (
                          <li key={i}>{improvement}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-medium">Performance Commentary</h3>
                      <p>{message.metadata.performance}</p>
                    </div>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                )}
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
      </div>
    </ScrollArea>
  );
}
