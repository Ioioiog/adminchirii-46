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
                </TableCell>
                <TableCell>
                  {invoice.property?.name || "N/A"}
                </TableCell>
                <TableCell>
                  {invoice.tenant ? `${invoice.tenant.first_name} ${invoice.tenant.last_name}` : "N/A"}
                </TableCell>
                <TableCell className="font-medium">
                  {formatAmount(invoice.amount, invoice.currency)}
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
