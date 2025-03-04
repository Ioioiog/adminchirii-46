import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { FileText, Trash2, ArrowUpDown, Percent } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { UtilityPaymentActions } from "./UtilityPaymentActions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { InvoiceMetadata } from "@/types/invoice";

interface Utility {
  id: string;
  property_id: string;
  type: string;
  amount: number;
  currency: string;
  due_date: string;
  status: string;
  issued_date?: string | null;
  invoice_number?: string | null;
  created_at?: string;
  updated_at?: string;
  invoiced?: boolean;
  invoiced_percentage?: number;
  metadata_amount?: number;
  property?: {
    name: string;
    address: string;
  } | null;
  invoiced_amount?: number;
  metadataAmount?: number;
}

interface UtilityListProps {
  utilities: Utility[];
  userRole: "landlord" | "tenant";
  onStatusUpdate?: () => void;
}

type SortField = "due_date" | "issued_date" | "amount" | "type" | "status";
type SortDirection = "asc" | "desc";

export function UtilityList({ utilities, userRole, onStatusUpdate }: UtilityListProps) {
  const { toast } = useToast();
  const { formatAmount } = useCurrency();
  const [sortField, setSortField] = useState<SortField>("due_date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [utilitiesWithInvoiceData, setUtilitiesWithInvoiceData] = useState<Utility[]>([]);

  console.log('UtilityList - Received utilities:', utilities);
  console.log('UtilityList - User role:', userRole);

  useEffect(() => {
    setUtilitiesWithInvoiceData(utilities);
  }, [utilities]);

  const handleStatusUpdate = async (utilityId: string, newStatus: string) => {
    try {
      console.log('Updating utility status:', { utilityId, newStatus });
      const { error } = await supabase
        .from("utilities")
        .update({ status: newStatus })
        .eq("id", utilityId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Utility bill status updated successfully!",
      });
      
      if (onStatusUpdate) {
        onStatusUpdate();
      }
    } catch (error) {
      console.error("Error updating utility status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update utility bill status.",
      });
    }
  };

  const handleViewInvoice = async (utilityId: string) => {
    try {
      console.log("Fetching invoice for utility ID:", utilityId);
      
      const { data: invoice, error: invoiceError } = await supabase
        .from('utility_invoices')
        .select('pdf_path')
        .eq('utility_id', utilityId)
        .maybeSingle();

      if (invoiceError) throw invoiceError;

      if (!invoice?.pdf_path) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No invoice file found for this utility bill.",
        });
        return;
      }

      const { data: { signedUrl }, error: urlError } = await supabase
        .storage
        .from('utility-invoices')
        .createSignedUrl(invoice.pdf_path, 60);

      if (urlError) throw urlError;

      window.open(signedUrl, '_blank');
    } catch (error) {
      console.error("Error viewing invoice:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to retrieve the invoice file.",
      });
    }
  };

  const handleDelete = async (utilityId: string) => {
    try {
      console.log("Deleting utility with ID:", utilityId);
      
      const { error: invoiceError } = await supabase
        .from('utility_invoices')
        .delete()
        .eq('utility_id', utilityId);

      if (invoiceError) {
        console.error("Error deleting associated invoices:", invoiceError);
        throw invoiceError;
      }

      const { error } = await supabase
        .from('utilities')
        .delete()
        .eq('id', utilityId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Utility bill deleted successfully!",
      });
      
      if (onStatusUpdate) {
        onStatusUpdate();
      }
    } catch (error) {
      console.error("Error deleting utility:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete utility bill.",
      });
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedUtilities = [...utilitiesWithInvoiceData].sort((a, b) => {
    let valueA, valueB;
    
    switch (sortField) {
      case "amount":
        valueA = a.amount;
        valueB = b.amount;
        break;
      case "due_date":
        valueA = new Date(a.due_date).getTime();
        valueB = new Date(b.due_date).getTime();
        break;
      case "issued_date":
        valueA = a.issued_date ? new Date(a.issued_date).getTime() : 0;
        valueB = b.issued_date ? new Date(b.issued_date).getTime() : 0;
        break;
      case "type":
        valueA = a.type.toLowerCase();
        valueB = b.type.toLowerCase();
        break;
      case "status":
        valueA = a.status.toLowerCase();
        valueB = b.status.toLowerCase();
        break;
      default:
        valueA = new Date(a.due_date).getTime();
        valueB = new Date(b.due_date).getTime();
    }
    
    const sortFactor = sortDirection === "asc" ? 1 : -1;
    
    if (valueA < valueB) return -1 * sortFactor;
    if (valueA > valueB) return 1 * sortFactor;
    return 0;
  });

  if (!Array.isArray(utilities)) {
    console.error("Utilities prop is not an array:", utilities);
    return (
      <div className="text-center py-8 text-gray-500">
        Error loading utilities.
      </div>
    );
  }

  const renderInvoicedAmount = (utility: Utility) => {
    const invoicedAmount = utility.metadata_amount !== undefined
      ? utility.metadata_amount
      : utility.metadataAmount !== undefined
        ? utility.metadataAmount
        : utility.invoiced_amount !== undefined
          ? utility.invoiced_amount
          : utility.invoiced && utility.invoiced_percentage
            ? (utility.amount * utility.invoiced_percentage) / 100
            : null;
    
    const remainingAmount = invoicedAmount !== null 
      ? utility.amount - invoicedAmount
      : null;
    
    if (invoicedAmount === null) {
      return 'N/A';
    }

    return (
      <div className="flex flex-col">
        <div>{formatAmount(invoicedAmount, utility.currency)}</div>
        {remainingAmount !== null && remainingAmount > 0 && (
          <div className="text-sm text-amber-600 mt-1">
            Remaining: {formatAmount(remainingAmount, utility.currency)}
          </div>
        )}
        {remainingAmount !== null && remainingAmount <= 0 && (
          <div className="text-sm text-green-600 mt-1">
            Fully paid
          </div>
        )}
      </div>
    );
  };

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
            <DropdownMenuItem onClick={() => handleSort("issued_date")}>
              Issued Date {sortField === "issued_date" && (sortDirection === "asc" ? "↑" : "↓")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSort("amount")}>
              Amount {sortField === "amount" && (sortDirection === "asc" ? "↑" : "↓")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSort("type")}>
              Type {sortField === "type" && (sortDirection === "asc" ? "↑" : "↓")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSort("status")}>
              Status {sortField === "status" && (sortDirection === "asc" ? "↑" : "↓")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Property</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Invoice #</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Issued Date</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedUtilities.map((utility) => (
            <TableRow key={utility.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{utility.property?.name || 'N/A'}</div>
                  <div className="text-sm text-gray-500">{utility.property?.address || 'N/A'}</div>
                </div>
              </TableCell>
              <TableCell className="capitalize">{utility.type}</TableCell>
              <TableCell>{utility.invoice_number || 'N/A'}</TableCell>
              <TableCell className="font-medium text-blue-600">
                <div className="flex items-center">
                  {formatAmount(utility.amount, utility.currency)}
                  {utility.invoiced_percentage && utility.invoiced_percentage > 0 && utility.invoiced_percentage < 100 && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge className="ml-2 bg-amber-100 text-amber-800 hover:bg-amber-200 flex items-center gap-1">
                            <Percent className="h-3 w-3" />
                            {utility.invoiced_percentage}%
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-sm">
                            Partially invoiced: {utility.invoiced_percentage}%
                            <br />
                            Original amount: {formatAmount(utility.amount, utility.currency)}
                            <br />
                            Invoiced amount: {formatAmount((utility.amount * utility.invoiced_percentage) / 100, utility.currency)}
                            <br />
                            Remaining: {formatAmount((utility.amount * (100 - utility.invoiced_percentage)) / 100, utility.currency)}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  {utility.invoiced_percentage && utility.invoiced_percentage === 100 && (
                    <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-200">
                      Fully Invoiced
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {utility.issued_date ? new Date(utility.issued_date).toLocaleDateString() : 'N/A'}
              </TableCell>
              <TableCell>{new Date(utility.due_date).toLocaleDateString()}</TableCell>
              <TableCell>
                <Badge
                  variant={utility.status === "paid" ? "default" : "secondary"}
                  className={`capitalize ${utility.invoiced ? "bg-blue-100 text-blue-800 hover:bg-blue-200" : ""}`}
                >
                  {utility.status} {utility.invoiced ? "(Invoiced)" : ""}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewInvoice(utility.id)}
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    View
                  </Button>
                  {userRole === "landlord" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(utility.id)}
                      className="flex items-center gap-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  )}
                  {(userRole === "landlord" || utility.status !== "paid") && (
                    <UtilityPaymentActions
                      utilityId={utility.id}
                      status={utility.status}
                      userRole={userRole}
                      onStatusChange={onStatusUpdate}
                    />
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
          {utilities.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                No utility bills found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
