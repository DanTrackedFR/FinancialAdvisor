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
import { Link } from "wouter";

export function AnalysisTable({ analyses }: { analyses: Analysis[] }) {
  const queryClient = useQueryClient();

  const handleStatusChange = async (id: number, newStatus: string) => {
    await apiRequest(`/api/analysis/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: newStatus }),
    });
    queryClient.invalidateQueries({ queryKey: ["/api/analyses"] });
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
        {analyses.map((analysis) => (
          <TableRow key={analysis.id}>
            <TableCell>{analysis.fileName}</TableCell>
            <TableCell>
              {format(new Date(analysis.createdAt), "MMM d, yyyy")}
            </TableCell>
            <TableCell>
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
              <Button asChild>
                <Link to={`/analysis/${analysis.id}`}>
                  {analysis.status === "Complete" ? "View Analysis" : "Access Analysis"}
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
