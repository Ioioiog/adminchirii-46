import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  ArrowUpDown, 
  ExternalLink 
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrency } from "@/hooks/useCurrency";

interface UtilityBill {
  id: string;
  provider_id: string;
  amount: number;
  due_date: string;
  status: string;
  created_at: string;
  updated_at: string;
  location_name: string | null;
  invoice_number: string;
  currency: string;
  consumption_period: string | null;
  pdf_path: string | null;
}

interface UtilityBillsListProps {
  bills: UtilityBill[];
  isLoading: boolean;
}

type SortField = "due_date" | "amount" | "invoice_number" | "status" | "location_name";
type SortDirection = "asc" | "desc";

export function UtilityBillsList({ bills, isLoading }: UtilityBillsListProps) {
  const { toast } = useToast();
  const { formatAmount } = useCurrency();
  const [sortField, setSortField] = useState<SortField>("due_date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if already sorting by this field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Otherwise set new field and default to descending
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleViewPdf = async (pdfPath: string | null) => {
    if (!pdfPath) {
      toast({
        title: "No PDF Available",
        description: "This utility bill doesn't have an attached PDF.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from('utility-invoices')
        .createSignedUrl(pdfPath, 300);

      if (error) throw error;

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      } else {
        throw new Error('Failed to generate signed URL');
      }
    } catch (error) {
      console.error("Error fetching PDF:", error);
      toast({
        title: "Error",
        description: "Failed to retrieve the bill PDF.",
        variant: "destructive",
      });
    }
  };

  // Sort bills based on current sort settings
  const sortedBills = [...bills].sort((a, b) => {
    let valueA, valueB;
    
    // Handle different field types
    switch (sortField) {
      case "amount":
        valueA = a.amount;
        valueB = b.amount;
        break;
      case "due_date":
        valueA = new Date(a.due_date).getTime();
        valueB = new Date(b.due_date).getTime();
        break;
      case "invoice_number":
        valueA = a.invoice_number?.toLowerCase() || "";
        valueB = b.invoice_number?.toLowerCase() || "";
        break;
      case "status":
        valueA = a.status.toLowerCase();
        valueB = b.status.toLowerCase();
        break;
      case "location_name":
        valueA = a.location_name?.toLowerCase() || "";
        valueB = b.location_name?.toLowerCase() || "";
        break;
      default:
        valueA = new Date(a.due_date).getTime();
        valueB = new Date(b.due_date).getTime();
    }
    
    // Apply sort direction
    const sortFactor = sortDirection === "asc" ? 1 : -1;
    
    if (valueA < valueB) return -1 * sortFactor;
    if (valueA > valueB) return 1 * sortFactor;
    return 0;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!bills || bills.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No utility bills found.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <div className="p-4 bg-gray-50 flex justify-end border-b">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4" />
              Sort By
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleSort("due_date")}>
              Due Date {sortField === "due_date" && (sortDirection === "asc" ? "↑" : "↓")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSort("amount")}>
              Amount {sortField === "amount" && (sortDirection === "asc" ? "↑" : "↓")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSort("invoice_number")}>
              Invoice # {sortField === "invoice_number" && (sortDirection === "asc" ? "↑" : "↓")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSort("status")}>
              Status {sortField === "status" && (sortDirection === "asc" ? "↑" : "↓")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSort("location_name")}>
              Location {sortField === "location_name" && (sortDirection === "asc" ? "↑" : "↓")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <ScrollArea className="h-[400px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedBills.map((bill) => (
              <TableRow key={bill.id}>
                <TableCell>{bill.invoice_number}</TableCell>
                <TableCell>{bill.location_name || 'N/A'}</TableCell>
                <TableCell className="font-medium text-blue-600">
                  {formatAmount(bill.amount, bill.currency)}
                </TableCell>
                <TableCell>{new Date(bill.due_date).toLocaleDateString()}</TableCell>
                <TableCell>{bill.consumption_period || 'N/A'}</TableCell>
                <TableCell>
                  <Badge
                    variant={bill.status === "paid" ? "default" : "secondary"}
                    className="capitalize"
                  >
                    {bill.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewPdf(bill.pdf_path)}
                      className="flex items-center gap-1"
                      disabled={!bill.pdf_path}
                    >
                      {bill.pdf_path ? (
                        <>
                          <FileText className="h-4 w-4" />
                          View PDF
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4" />
                          No PDF
                        </>
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
