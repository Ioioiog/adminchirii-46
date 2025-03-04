
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { FileText, Calendar, User, Building, CreditCard } from "lucide-react";
import { formatAmount } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Invoice } from "@/types/invoice";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface InvoiceDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
}

export function InvoiceDetailsDialog({ 
  open, 
  onOpenChange, 
  invoiceId 
}: InvoiceDetailsDialogProps) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      if (!open || !invoiceId) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("invoices")
          .select(`
            *,
            property:properties (
              name,
              address
            ),
            tenant:profiles!invoices_tenant_id_fkey (
              first_name,
              last_name,
              email
            )
          `)
          .eq("id", invoiceId)
          .single();

        if (error) throw error;
        setInvoice(data as Invoice);
      } catch (error) {
        console.error("Error fetching invoice details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoiceDetails();
  }, [invoiceId, open]);

  if (!invoice && !isLoading) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-white rounded-lg shadow-lg border-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-100 text-blue-600">
              <FileText size={20} />
            </div>
            <DialogTitle className="text-xl font-semibold text-gray-800">
              {isLoading ? "Loading Invoice..." : `Invoice #${invoiceId.substr(0, 8)}`}
            </DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="p-6 space-y-6">
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="w-full h-6 bg-gray-200 rounded"></div>
              <div className="w-3/4 h-6 bg-gray-200 rounded"></div>
              <div className="w-1/2 h-6 bg-gray-200 rounded"></div>
            </div>
          ) : invoice ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Building className="h-5 w-5 text-gray-400" />
                    Property Details
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-md border space-y-2">
                    <p><span className="font-medium">Name:</span> {invoice.property.name}</p>
                    <p><span className="font-medium">Address:</span> {invoice.property.address}</p>
                  </div>
                  
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <User className="h-5 w-5 text-gray-400" />
                    Tenant Information
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-md border space-y-2">
                    <p><span className="font-medium">Name:</span> {invoice.tenant?.first_name} {invoice.tenant?.last_name}</p>
                    <p><span className="font-medium">Email:</span> {invoice.tenant?.email}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    Invoice Details
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-md border space-y-2">
                    <p><span className="font-medium">Status:</span> <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 
                      invoice.status === 'overdue' ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800'
                    }`}>{invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}</span></p>
                    <p><span className="font-medium">Created:</span> {format(new Date(invoice.created_at), 'MMM d, yyyy')}</p>
                    <p><span className="font-medium">Due Date:</span> {format(new Date(invoice.due_date), 'MMM d, yyyy')}</p>
                    {invoice.paid_at && (
                      <p><span className="font-medium">Paid Date:</span> {format(new Date(invoice.paid_at), 'MMM d, yyyy')}</p>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-gray-400" />
                    Payment Details
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-md border space-y-2">
                    <p><span className="font-medium">Amount:</span> {formatAmount(invoice.amount, invoice.currency)}</p>
                    
                    {invoice.vat_rate > 0 && (
                      <p><span className="font-medium">VAT Rate:</span> {invoice.vat_rate}%</p>
                    )}
                    
                    {invoice.metadata?.utilities_included?.length > 0 && (
                      <div className="mt-2">
                        <p className="font-medium">Utilities Included:</p>
                        <ul className="list-disc list-inside ml-2 mt-1">
                          {invoice.metadata.utilities_included.map((util, idx) => (
                            <li key={idx}>{util.type}: {formatAmount(util.amount, invoice.currency)}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {invoice.metadata?.date_range && (
                      <p><span className="font-medium">Period:</span> {format(new Date(invoice.metadata.date_range.from), 'MMM d, yyyy')} - {format(new Date(invoice.metadata.date_range.to), 'MMM d, yyyy')}</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No invoice data found</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
