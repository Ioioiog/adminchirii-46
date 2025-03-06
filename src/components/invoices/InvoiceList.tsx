
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/useCurrency";
import { InvoiceActions } from "@/components/invoices/InvoiceActions";
import { InvoiceDetailsDialog } from "@/components/invoices/InvoiceDetailsDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Invoice } from "@/types/invoice";
import { InfoIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface InvoiceListProps {
  invoices: Invoice[];
  userRole: "landlord" | "tenant";
  onStatusUpdate?: () => void;
}

export function InvoiceList({ invoices, userRole, onStatusUpdate }: InvoiceListProps) {
  const { formatAmount } = useCurrency();
  const { toast } = useToast();
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const handleViewInvoice = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    setDetailsDialogOpen(true);
  };

  console.log("InvoiceList received invoices:", invoices);

  const getInvoiceTypeLabel = (invoice: Invoice) => {
    const metadata = invoice.metadata;
    
    if (!metadata) return null;
    
    // Check if this invoice contains any utilities
    const hasUtilities = metadata.utilities_included && metadata.utilities_included.length > 0;
    
    // Assume it's a rent invoice if there are no utilities or if utilities don't account for the total amount
    const isRentOnly = !hasUtilities;
    
    if (hasUtilities) {
      // Calculate the total amount from utilities
      const utilitiesTotalAmount = metadata.utilities_included.reduce((sum, util) => 
        sum + (util.original_amount || util.amount || 0), 0);
      
      // Determine if this is utilities-only by comparing the total amount
      // Allow for a small margin of error (e.g., 1 unit) for rounding differences
      const isUtilitiesOnly = Math.abs(invoice.amount - utilitiesTotalAmount) <= 1;
      
      if (isUtilitiesOnly) {
        return (
          <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-800 border-blue-200">
            Utilities Only
          </Badge>
        );
      } else {
        return (
          <Badge variant="outline" className="ml-2 bg-purple-50 text-purple-800 border-purple-200">
            Rent + Utilities
          </Badge>
        );
      }
    } else if (isRentOnly) {
      return (
        <Badge variant="outline" className="ml-2 bg-green-50 text-green-800 border-green-200">
          Rent Only
        </Badge>
      );
    }
    
    return null;
  };

  const getUtilitiesDetails = (invoice: Invoice) => {
    if (!invoice.metadata?.utilities_included || invoice.metadata.utilities_included.length === 0) {
      return null;
    }
    
    const utilities = invoice.metadata.utilities_included;
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <InfoIcon className="h-4 w-4 text-blue-500 inline ml-1 cursor-help" />
          </TooltipTrigger>
          <TooltipContent className="w-64 p-3">
            <div className="space-y-2">
              <p className="font-medium">Included Utilities:</p>
              <ul className="text-xs space-y-1.5">
                {utilities.map((util: any, index: number) => (
                  <li key={index} className="flex justify-between">
                    <span className="capitalize">{util.type}</span>
                    <span className="font-medium">
                      {formatAmount(util.amount, util.currency || invoice.currency)}
                      {util.percentage && util.percentage < 100 && (
                        <span className="text-xs ml-1 text-gray-500">
                          ({util.percentage}%)
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice #</TableHead>
            <TableHead>Property</TableHead>
            <TableHead>Tenant</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                No invoices found
              </TableCell>
            </TableRow>
          ) : (
            invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>
                  {invoice.id.substring(0, 8)}
                  {getInvoiceTypeLabel(invoice)}
                </TableCell>
                <TableCell>
                  {invoice.property?.name || "N/A"}
                </TableCell>
                <TableCell>
                  {invoice.tenant ? `${invoice.tenant.first_name} ${invoice.tenant.last_name}` : "N/A"}
                </TableCell>
                <TableCell className="font-medium">
                  {invoice.amount ? (
                    <div className="flex items-center">
                      {formatAmount(invoice.amount, invoice.currency)}
                      {getUtilitiesDetails(invoice)}
                    </div>
                  ) : (
                    "0.00"
                  )}
                </TableCell>
                <TableCell>
                  {new Date(invoice.due_date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={invoice.status === "paid" ? "default" : 
                           invoice.status === "overdue" ? "destructive" : "secondary"}
                  >
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <InvoiceActions
                    invoiceId={invoice.id}
                    status={invoice.status}
                    userRole={userRole}
                    onStatusUpdate={onStatusUpdate}
                    onViewInvoice={() => handleViewInvoice(invoice.id)}
                    onDelete={onStatusUpdate}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Add the invoice details dialog component directly */}
      {selectedInvoiceId && (
        <InvoiceDetailsDialog
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
          invoiceId={selectedInvoiceId}
        />
      )}
    </div>
  );
}
