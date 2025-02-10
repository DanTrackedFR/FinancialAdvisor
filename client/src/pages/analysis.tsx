import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { StandardType } from "@shared/schema";
import { UploadArea } from "@/components/upload-area";
import { StandardSelector } from "@/components/standard-selector";
import { ConversationThread } from "@/components/conversation-thread";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, FileText, Plus } from "lucide-react";
import { format } from "date-fns";

export default function Analysis() {
  const [analysisId, setAnalysisId] = useState<number>();
  const [standard, setStandard] = useState<StandardType>("IFRS");
  const [message, setMessage] = useState("");
  const [showNewAnalysis, setShowNewAnalysis] = useState(false);
  const { toast } = useToast();

  // Fetch all analyses
  const { data: analyses = [], isLoading: isLoadingAnalyses } = useQuery({
    queryKey: ["/api/analyses"],
  });

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
      setShowNewAnalysis(false);
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

  if (isLoadingAnalyses) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {!analysisId ? (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Financial Statement Analysis</h1>
              <Button onClick={() => setShowNewAnalysis(true)}>
                <Plus className="mr-2 h-4 w-4" /> New Analysis
              </Button>
            </div>

            {showNewAnalysis ? (
              <Card className="p-6 space-y-6">
                <CardHeader>
                  <CardTitle>New Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
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
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {analyses.map((analysis) => (
                  <Card
                    key={analysis.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setAnalysisId(analysis.id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="font-medium">{analysis.fileName}</h3>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(analysis.createdAt), "PPP")}
                          </p>
                        </div>
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="mt-4">
                        <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset">
                          {analysis.standard}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => setAnalysisId(undefined)}
              >
                ← Back to Analyses
              </Button>
            </div>
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