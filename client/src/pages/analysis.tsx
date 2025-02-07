import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { StandardType } from "@shared/schema";
import { UploadArea } from "@/components/upload-area";
import { StandardSelector } from "@/components/standard-selector";
import { ConversationThread } from "@/components/conversation-thread";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Analysis() {
  const [analysisId, setAnalysisId] = useState<number>();
  const [standard, setStandard] = useState<StandardType>("IFRS");
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ["/api/analysis", analysisId, "messages"],
    enabled: !!analysisId,
  });

  const { mutate: startAnalysis, isPending: isAnalyzing } = useMutation({
    mutationFn: async ({
      fileName,
      content,
    }: {
      fileName: string;
      content: string;
    }) => {
      const res = await apiRequest("POST", "/api/analysis", {
        fileName,
        fileContent: content,
        standard,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setAnalysisId(data.id);
      toast({
        title: "Analysis started",
        description: "Your financial statement is being analyzed",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { mutate: sendMessage, isPending: isSending } = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", `/api/analysis/${analysisId}/messages`, {
        content,
        role: "user",
      });
      return res.json();
    },
    onSuccess: () => {
      setMessage("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {!analysisId ? (
          <Card className="p-6 space-y-6">
            <h1 className="text-2xl font-bold">New Analysis</h1>
            <StandardSelector
              value={standard}
              onChange={setStandard}
              disabled={isAnalyzing}
            />
            <UploadArea
              onFileProcessed={(fileName, content) =>
                startAnalysis({ fileName, content })
              }
              isLoading={isAnalyzing}
            />
          </Card>
        ) : (
          <div className="space-y-4">
            <ConversationThread
              messages={messages}
              isLoading={isLoadingMessages || isSending}
            />
            <div className="flex gap-4">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask a question about the analysis..."
                className="flex-1"
                disabled={isSending}
              />
              <Button
                onClick={() => sendMessage(message)}
                disabled={!message.trim() || isSending}
              >
                Send
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
