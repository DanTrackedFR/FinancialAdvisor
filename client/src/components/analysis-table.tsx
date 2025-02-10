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
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

export function AnalysisTable({ 
  analyses,
  onNewAnalysis 
}: { 
  analyses: Analysis[];
  onNewAnalysis: () => void;
}) {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const handleStatusChange = async (id: number, newStatus: string) => {
    await apiRequest(`/api/analysis/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: newStatus }),
    });
    queryClient.invalidateQueries({ queryKey: ["/api/user/analyses"] });
  };

  const navigateToAnalysis = (id: number) => {
    setLocation(`/analysis/${id}`);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Analysis Name</TableHead>
          <TableHead>Date Created</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Action</TableHead>
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
              <TableCell>
                <Button onClick={() => navigateToAnalysis(analysis.id)}>
                  {analysis.status === "Complete" ? "View Analysis" : "Access Analysis"}
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}