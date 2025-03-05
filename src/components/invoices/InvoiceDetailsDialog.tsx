
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { FileText, Calendar, User, Building, CreditCard, Download, Printer, ClipboardCheck, Receipt } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { supabase } from "@/integrations/supabase/client";
import { Invoice, InvoiceMetadata } from "@/types/invoice";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
  const { formatAmount, currency } = useCurrency();

  // Helper functions for amount calculations
  const calculateSubtotal = (invoice: Invoice): number => {
    // First check if subtotal is stored in metadata
    if (invoice.metadata && typeof invoice.metadata === 'object' && 'subtotal' in invoice.metadata) {
      return Number(invoice.metadata.subtotal);
    }
    
    // Fall back to calculation if not stored
    const utilities = invoice.metadata && typeof invoice.metadata === 'object' && 
                      invoice.metadata.utilities_included ? invoice.metadata.utilities_included : [];
    const utilitiesTotal = utilities.reduce((sum, util) => sum + (util.amount || 0), 0);
    
    // If VAT is applied, calculate subtotal by removing VAT from total
    if (invoice.vat_rate && invoice.vat_rate > 0) {
      // Subtract utilities first as they typically don't have VAT
      const rentWithVat = invoice.amount - utilitiesTotal;
      const rentWithoutVat = rentWithVat / (1 + invoice.vat_rate / 100);
      return rentWithoutVat + utilitiesTotal;
    }
    
    // If no VAT, subtotal equals total amount
    return invoice.amount;
  };

  const calculateVatAmount = (invoice: Invoice): number => {
    // First check if VAT amount is stored in metadata
    if (invoice.metadata && typeof invoice.metadata === 'object' && 'vat_amount' in invoice.metadata) {
      return Number(invoice.metadata.vat_amount);
    }
    
    // Fall back to calculation if not stored
    if (invoice.vat_rate && invoice.vat_rate > 0) {
      const subtotal = calculateSubtotal(invoice);
      const utilities = invoice.metadata && typeof invoice.metadata === 'object' && 
                       invoice.metadata.utilities_included ? invoice.metadata.utilities_included : [];
      const utilitiesTotal = utilities.reduce((sum, util) => sum + (util.amount || 0), 0);
      
      // VAT is typically only applied to rent, not utilities
      const rentAmount = subtotal - utilitiesTotal;
      return rentAmount * (invoice.vat_rate / 100);
    }
    
    return 0;
  };

  const calculateRentAmount = (invoice: Invoice): number => {
    console.log("Calculating rent amount for invoice:", invoice);
    
    // Check if the original rent amount is stored directly in metadata
    if (invoice.metadata && typeof invoice.metadata === 'object' && 
        'original_rent_amount' in invoice.metadata) {
      console.log("Using original rent amount from metadata:", 
        invoice.metadata.original_rent_amount, 
        invoice.metadata.original_rent_currency);
      return Number(invoice.metadata.original_rent_amount);
    }
    
    // Directly use the stored subtotal if available since it represents the rent amount
    // before VAT but including utilities
    if (invoice.metadata && typeof invoice.metadata === 'object' && 'subtotal' in invoice.metadata) {
      const utilities = invoice.metadata.utilities_included || [];
      const utilitiesTotal = utilities.reduce((sum, util) => sum + (util.amount || 0), 0);
      const rentAmount = Number(invoice.metadata.subtotal) - utilitiesTotal;
      console.log("Calculated rent from subtotal:", rentAmount, "Subtotal:", invoice.metadata.subtotal, "Utilities total:", utilitiesTotal);
      return rentAmount;
    }
    
    // If no metadata, fall back to calculation
    const subtotal = calculateSubtotal(invoice);
    const utilities = invoice.metadata && typeof invoice.metadata === 'object' && 
                     invoice.metadata.utilities_included ? invoice.metadata.utilities_included : [];
    const utilitiesTotal = utilities.reduce((sum, util) => sum + (util.amount || 0), 0);
    
    // Rent is subtotal minus utilities
    const rentAmount = subtotal - utilitiesTotal;
    console.log("Calculated rent with fallback method:", rentAmount);
    return rentAmount;
  };
  
  // Helper function to get actual utility amount
  const getUtilityAmount = (util: any): number => {
    // If it's a partial utility, we should display the current amount being billed
    // not the original amount
    return util.amount || 0;
  };

  // Helper function to check if utility is partially invoiced
  const isPartiallyInvoiced = (util: any): boolean => {
    return (util.original_amount && util.original_amount > util.amount) || 
           (util.invoiced_amount && util.invoiced_amount > 0);
  };

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
              address,
              monthly_rent,
              currency
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
        
        // Add property currency and rent to metadata if not present
        if (data && data.property && data.property.monthly_rent) {
          // Create a new typed metadata object to ensure we have the right structure
          let updatedMetadata: InvoiceMetadata = {};
          
          // If metadata exists and is an object, copy its values
          if (data.metadata && typeof data.metadata === 'object' && !Array.isArray(data.metadata)) {
            updatedMetadata = { ...data.metadata as Record<string, any> };
          }
          
          // Only add rent information if it doesn't exist yet
          if (!updatedMetadata.original_rent_amount) {
            updatedMetadata.original_rent_amount = data.property.monthly_rent;
            updatedMetadata.original_rent_currency = data.property.currency;
          }
          
          // Update the data with our properly typed metadata
          data.metadata = updatedMetadata;
        }
        
        setInvoice(data as Invoice);
        console.log("Fetched invoice:", data);
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
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-white rounded-lg shadow-lg border-0">
        <DialogHeader className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                <Receipt size={24} />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-gray-800">
                  {isLoading ? "Loading Invoice..." : `Invoice #${invoiceId.substr(0, 8)}`}
                </DialogTitle>
                {!isLoading && invoice && (
                  <p className="text-gray-500 mt-1">
                    Issued: {format(new Date(invoice.created_at), 'MMMM d, yyyy')}
                  </p>
                )}
              </div>
            </div>
            <div className="flex space-x-2">
              <Button size="sm" variant="outline" className="flex items-center gap-1">
                <Download size={16} /> 
                <span className="hidden sm:inline">Download</span>
              </Button>
              <Button size="sm" variant="outline" className="flex items-center gap-1">
                <Printer size={16} /> 
                <span className="hidden sm:inline">Print</span>
              </Button>
            </div>
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
              <div className="flex justify-between flex-col md:flex-row gap-6">
                <div className="space-y-4 flex-1">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-700">
                      <Building className="h-5 w-5 text-blue-500" />
                      From
                    </h3>
                    <Card className="overflow-hidden border border-gray-200">
                      <CardContent className="p-4 bg-gray-50">
                        <p className="font-semibold">{invoice.property.name}</p>
                        <p className="text-gray-600 mt-1">{invoice.property.address}</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-700">
                      <User className="h-5 w-5 text-blue-500" />
                      Bill To
                    </h3>
                    <Card className="overflow-hidden border border-gray-200">
                      <CardContent className="p-4 bg-gray-50">
                        <p className="font-semibold">{invoice.tenant?.first_name} {invoice.tenant?.last_name}</p>
                        <p className="text-gray-600 mt-1">{invoice.tenant?.email}</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
                
                <div className="space-y-4 flex-1">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-700">
                      <Calendar className="h-5 w-5 text-blue-500" />
                      Invoice Details
                    </h3>
                    <Card className="overflow-hidden border border-gray-200">
                      <CardContent className="p-4 bg-gray-50 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 
                            invoice.status === 'overdue' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Invoice Date:</span>
                          <span>{format(new Date(invoice.created_at), 'MMM d, yyyy')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Due Date:</span>
                          <span className={invoice.status === 'overdue' ? 'text-red-600 font-medium' : ''}>
                            {format(new Date(invoice.due_date), 'MMM d, yyyy')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Currency:</span>
                          <span>{invoice.currency}</span>
                        </div>
                        {invoice.paid_at && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Payment Date:</span>
                            <span className="text-green-600">
                              {format(new Date(invoice.paid_at), 'MMM d, yyyy')}
                            </span>
                          </div>
                        )}
                        {invoice.metadata?.date_range && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Period:</span>
                            <span>
                              {format(new Date(invoice.metadata.date_range.from), 'MMM d')} - {format(new Date(invoice.metadata.date_range.to), 'MMM d, yyyy')}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4 text-gray-700">Invoice Summary</h3>
                <div className="bg-white border rounded-md overflow-hidden">
                  <div className="grid grid-cols-12 bg-gray-100 p-4 text-sm font-medium text-gray-700">
                    <div className="col-span-6">Description</div>
                    <div className="col-span-2 text-right">Amount</div>
                    <div className="col-span-2 text-right">VAT</div>
                    <div className="col-span-2 text-right">Total</div>
                  </div>
                  
                  <div className="divide-y">
                    <div className="grid grid-cols-12 p-4 text-sm">
                      <div className="col-span-6">
                        <p className="font-medium">Rent</p>
                        {invoice.metadata && typeof invoice.metadata === 'object' && 
                         'original_rent_currency' in invoice.metadata && 
                         invoice.metadata.original_rent_currency !== invoice.currency && (
                          <p className="text-xs text-gray-500 mt-1">
                            {formatAmount(Number(invoice.metadata.original_rent_amount) || 0, invoice.metadata.original_rent_currency as string)} converted to {invoice.currency}
                          </p>
                        )}
                        {invoice.metadata && typeof invoice.metadata === 'object' && 
                         'is_partial' in invoice.metadata && invoice.metadata.is_partial && (
                          <p className="text-xs text-gray-500 mt-1">
                            {invoice.metadata.partial_percentage}% of {formatAmount(Number(invoice.metadata.full_amount) || 0, invoice.currency)}
                          </p>
                        )}
                      </div>
                      <div className="col-span-2 text-right">
                        {formatAmount(calculateRentAmount(invoice), invoice.currency)}
                      </div>
                      <div className="col-span-2 text-right">
                        {formatAmount(calculateVatAmount(invoice), invoice.currency)}
                      </div>
                      <div className="col-span-2 text-right font-medium">
                        {formatAmount(calculateRentAmount(invoice) + calculateVatAmount(invoice), invoice.currency)}
                      </div>
                    </div>
                    
                    {invoice.metadata && typeof invoice.metadata === 'object' && 
                     'utilities_included' in invoice.metadata && 
                     invoice.metadata.utilities_included && 
                     invoice.metadata.utilities_included.length > 0 && (
                      invoice.metadata.utilities_included.map((util: any, idx: number) => (
                        <div key={idx} className="grid grid-cols-12 p-4 text-sm">
                          <div className="col-span-6">
                            <p className="font-medium">{util.type}</p>
                            {isPartiallyInvoiced(util) && (
                              <p className="text-xs text-gray-500 mt-1">
                                Partial billing: {formatAmount(getUtilityAmount(util), util.currency || invoice.currency)} of {formatAmount(util.original_amount || 0, util.currency || invoice.currency)}
                                {util.invoiced_amount > 0 && (
                                  <span> (Previously invoiced: {formatAmount(util.invoiced_amount, util.currency || invoice.currency)})</span>
                                )}
                              </p>
                            )}
                            {util.percentage !== undefined && util.percentage < 100 && (
                              <p className="text-xs text-gray-500 mt-1">
                                {util.percentage}% of {formatAmount(util.original_amount || 0, util.currency || invoice.currency)}
                              </p>
                            )}
                          </div>
                          <div className="col-span-2 text-right">
                            {formatAmount(getUtilityAmount(util), util.currency || invoice.currency)}
                          </div>
                          <div className="col-span-2 text-right">{formatAmount(0, util.currency || invoice.currency)}</div>
                          <div className="col-span-2 text-right font-medium">
                            {formatAmount(getUtilityAmount(util), util.currency || invoice.currency)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <div className="bg-gray-50 p-4 border-t">
                    <div className="grid grid-cols-12 text-sm">
                      <div className="col-span-8 text-right font-medium">Subtotal:</div>
                      <div className="col-span-4 text-right">
                        {formatAmount(calculateSubtotal(invoice), invoice.currency)}
                      </div>
                    </div>
                    
                    {invoice.vat_rate > 0 && (
                      <div className="grid grid-cols-12 text-sm mt-2">
                        <div className="col-span-8 text-right font-medium">VAT ({invoice.vat_rate}%):</div>
                        <div className="col-span-4 text-right">
                          {formatAmount(calculateVatAmount(invoice), invoice.currency)}
                        </div>
                      </div>
                    )}
                    
                    <Separator className="my-3" />
                    
                    <div className="grid grid-cols-12 text-base font-bold">
                      <div className="col-span-8 text-right">Total Due:</div>
                      <div className="col-span-4 text-right">{formatAmount(invoice.amount, invoice.currency)}</div>
                    </div>
                    
                    {invoice.status === 'paid' && (
                      <div className="mt-4 text-center">
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
                          <ClipboardCheck size={16} className="mr-1" />
                          <span className="text-sm font-medium">Paid in Full</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md border mt-8">
                <p className="text-sm text-gray-600 text-center">
                  Thank you for your business. If you have any questions about this invoice,
                  please contact your property manager.
                </p>
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
