
import { useToast } from "@/hooks/use-toast";
import { Invoice } from "@/types/invoice";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { InvoiceGenerator } from "./InvoiceGenerator";
import { useState } from "react";
import { InvoiceDetails } from "./InvoiceDetails";
import { InvoiceActions } from "./InvoiceActions";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useCurrency } from "@/hooks/useCurrency";

interface InvoiceListProps {
  invoices: Invoice[];
  userRole: "landlord" | "tenant";
  onStatusUpdate?: () => void;
}

export function InvoiceList({ invoices, userRole, onStatusUpdate }: InvoiceListProps) {
  const { toast } = useToast();
  const { formatAmount } = useCurrency();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const handleViewInvoice = async (invoice: Invoice) => {
    try {
      console.log("Fetching invoice details for ID:", invoice.id);
      
      // Get invoice items
      const { data: items, error: itemsError } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoice.id);

      if (itemsError) throw itemsError;

      // Get landlord profile for company info
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('invoice_info')
        .eq('id', invoice.landlord_id)
        .single();

      if (profileError) throw profileError;

      // Transform invoice items
      const transformedItems = items.map(item => ({
        description: item.description,
        unitPrice: item.amount,
        quantity: 1,
        type: item.type
      }));

      setInvoiceItems(transformedItems);
      setCompanyInfo(profile.invoice_info);
      setSelectedInvoice(invoice);

    } catch (error) {
      console.error("Error viewing invoice:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to retrieve invoice details.",
      });
    }
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              {userRole === "landlord" && <TableHead>Tenant</TableHead>}
              <TableHead>Amount</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{invoice.property?.name}</div>
                    <div className="text-sm text-gray-500">{invoice.property?.address}</div>
                  </div>
                </TableCell>
                {userRole === "landlord" && (
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {invoice.tenant?.first_name} {invoice.tenant?.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{invoice.tenant?.email}</div>
                    </div>
                  </TableCell>
                )}
                <TableCell className="font-medium text-blue-600">
                  {formatAmount(invoice.amount)}
                </TableCell>
                <TableCell>
                  {format(new Date(invoice.due_date), 'PPP')}
                </TableCell>
                <TableCell>
                  <Badge variant={invoice.status === "paid" ? "default" : "secondary"}>
                    {invoice.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <InvoiceActions
                    invoiceId={invoice.id}
                    status={invoice.status}
                    userRole={userRole}
                    onStatusUpdate={onStatusUpdate}
                    onViewInvoice={() => handleViewInvoice(invoice)}
                    isSendingEmail={isSendingEmail}
                  />
                </TableCell>
              </TableRow>
            ))}
            {invoices.length === 0 && (
              <TableRow>
                <TableCell 
                  colSpan={userRole === "landlord" ? 6 : 5} 
                  className="text-center py-8 text-gray-500"
                >
                  No invoices found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        <DialogContent className="max-w-4xl">
          <DialogTitle className="sr-only">Invoice Details</DialogTitle>
          {selectedInvoice && companyInfo && (
            <InvoiceGenerator
              invoice={selectedInvoice}
              invoiceItems={invoiceItems}
              companyInfo={companyInfo}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
