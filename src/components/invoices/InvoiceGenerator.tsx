
import React from 'react';
import { formatDate } from '@/lib/utils';
import { useCurrency } from '@/hooks/useCurrency';

interface InvoiceItem {
  description: string;
  unitPrice: number;
  quantity: number;
  type?: 'rent' | 'utility' | 'tax';
}

interface InvoiceGeneratorProps {
  invoice: {
    id: string;
    due_date: string;
    created_at: string;
    vat_rate?: number;
    currency: string;
    property?: {
      name: string;
      address: string;
    };
    tenant?: {
      first_name?: string;
      last_name?: string;
    };
  };
  invoiceItems: InvoiceItem[];
  companyInfo: {
    company_name?: string;
    company_address?: string;
    bank_name?: string;
    bank_account_number?: string;
  };
}

export function InvoiceGenerator({ invoice, invoiceItems, companyInfo }: InvoiceGeneratorProps) {
  const { formatAmount } = useCurrency();

  if (!invoice || !invoiceItems || !companyInfo) {
    console.error('Missing required props:', { invoice, invoiceItems, companyInfo });
    return <div>Unable to generate invoice. Missing required information.</div>;
  }

  const calculateSubtotal = () => {
    // Only calculate subtotal for non-tax items
    return invoiceItems
      .filter(item => item.type !== 'tax')
      .reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  };

  const calculateRentVAT = () => {
    // Only apply VAT if it's specified in the invoice
    if (!invoice.vat_rate) return 0;
    
    // Find rent items and calculate VAT only for them
    const rentItems = invoiceItems.filter(item => item.type === 'rent');
    const rentTotal = rentItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    return (rentTotal * invoice.vat_rate) / 100;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const rentVAT = calculateRentVAT();
    return subtotal + rentVAT;
  };

  // Filter out tax items as they'll be displayed separately
  const displayItems = invoiceItems.filter(item => item.type !== 'tax');

  const tenantName = invoice.tenant 
    ? `${invoice.tenant.first_name || ''} ${invoice.tenant.last_name || ''}`.trim()
    : 'N/A';

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-primary">INVOICE</h1>
          <p className="text-xl text-primary/80 mt-2">{invoice.property?.name || 'N/A'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="text-muted-foreground font-semibold mb-2">BILLED TO:</h2>
          <p className="text-foreground">{tenantName}</p>
          <p className="text-muted-foreground">{invoice.property?.address}</p>
        </div>
        <div>
          <h2 className="text-muted-foreground font-semibold mb-2">PAY TO:</h2>
          <p className="text-foreground">{companyInfo.company_name || 'N/A'}</p>
          <p className="text-muted-foreground">{companyInfo.company_address}</p>
          {companyInfo.bank_name && (
            <p className="text-muted-foreground mt-2">Bank: {companyInfo.bank_name}</p>
          )}
          {companyInfo.bank_account_number && (
            <p className="text-muted-foreground">Account No: {companyInfo.bank_account_number}</p>
          )}
        </div>
      </div>

      <div className="mb-8">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 text-muted-foreground">DESCRIPTION</th>
              <th className="text-left py-2 text-muted-foreground">UNIT PRICE</th>
              <th className="text-left py-2 text-muted-foreground">QTY</th>
              <th className="text-right py-2 text-muted-foreground">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {displayItems.map((item, index) => (
              <tr key={index} className="border-b">
                <td className="py-2 text-foreground">{item.description}</td>
                <td className="py-2 text-foreground">
                  {formatAmount(item.unitPrice, invoice.currency)}
                </td>
                <td className="py-2 text-foreground">{item.quantity}</td>
                <td className="py-2 text-foreground text-right">
                  {formatAmount(item.unitPrice * item.quantity, invoice.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <div className="w-64">
          <div className="flex justify-between mb-2">
            <span className="text-muted-foreground">SUBTOTAL</span>
            <span className="text-foreground">
              {formatAmount(calculateSubtotal(), invoice.currency)}
            </span>
          </div>
          {invoice.vat_rate && invoice.vat_rate > 0 && (
            <div className="flex justify-between mb-2">
              <span className="text-muted-foreground">VAT ({invoice.vat_rate}%) on Rent</span>
              <span className="text-foreground">
                {formatAmount(calculateRentVAT(), invoice.currency)}
              </span>
            </div>
          )}
          <div className="flex justify-between font-bold border-t pt-2">
            <span>TOTAL</span>
            <span>{formatAmount(calculateTotal(), invoice.currency)}</span>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-muted-foreground">INVOICE NO: {invoice.id}</p>
            <p className="text-muted-foreground">
              DATE: {formatDate(new Date(invoice.created_at))}
            </p>
            <p className="text-muted-foreground">
              DUE DATE: {formatDate(new Date(invoice.due_date))}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl text-primary font-bold">THANK YOU</p>
          </div>
        </div>
      </div>
    </div>
  );
}
