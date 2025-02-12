import { Analysis } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export function AnalysisTable({ 
  analyses,
  onNewAnalysis 
}: { 
  analyses: Analysis[];
  onNewAnalysis: () => void;
}) {
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [openDialogs, setOpenDialogs] = useState<Record<number, boolean>>({});

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await apiRequest("PATCH", `/api/analysis/${id}/status`, {
        status: newStatus
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/analyses"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/analysis/${id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/user/analyses"] });
      toast({
        title: "Analysis Deleted",
        description: "The analysis has been successfully deleted.",
      });
      setOpenDialogs(prev => ({ ...prev, [id]: false }));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the analysis. Please try again.",
        variant: "destructive",
      });
    }
  };

  const navigateToAnalysis = (id: number) => {
    navigate(`/analysis/${id}`);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Analysis Name</TableHead>
          <TableHead>Date Created</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {analyses.length === 0 ? (
          <TableRow>
            <TableCell>
              <Button onClick={onNewAnalysis}>New Analysis</Button>
            </TableCell>
            <TableCell>-</TableCell>
            <TableCell>-</TableCell>
            <TableCell>-</TableCell>
          </TableRow>
        ) : (
          analyses.map((analysis) => (
            <TableRow key={analysis.id} className="cursor-pointer hover:bg-accent/50">
              <TableCell onClick={() => navigateToAnalysis(analysis.id)}>
                {analysis.fileName}
              </TableCell>
              <TableCell onClick={() => navigateToAnalysis(analysis.id)}>
                {format(new Date(analysis.createdAt), "MMM d, yyyy")}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Select
                  value={analysis.status}
                  onValueChange={(value) => handleStatusChange(analysis.id, value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Drafting">Drafting</SelectItem>
                    <SelectItem value="In Review">In Review</SelectItem>
                    <SelectItem value="Complete">Complete</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button onClick={() => navigateToAnalysis(analysis.id)}>
                  {analysis.status === "Complete" ? "View Analysis" : "Access Analysis"}
                </Button>
                <AlertDialog 
                  open={openDialogs[analysis.id]} 
                  onOpenChange={(open) => setOpenDialogs(prev => ({ ...prev, [analysis.id]: open }))}
                >
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Analysis</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this analysis? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleDelete(analysis.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}