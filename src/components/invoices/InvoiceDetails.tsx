
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Invoice } from "@/types/invoice";
import { useCurrency } from "@/hooks/useCurrency";

interface InvoiceDetailsProps {
  invoice: Invoice;
  userRole: "landlord" | "tenant";
}

export function InvoiceDetails({ invoice, userRole }: InvoiceDetailsProps) {
  const { formatAmount } = useCurrency();
  
  // Check if this is a partial invoice
  const isPartialInvoice = invoice.metadata?.is_partial;
  const calculationMethod = invoice.metadata?.calculation_method || 'percentage';
  const partialPercentage = invoice.metadata?.partial_percentage;
  const daysCalculated = invoice.metadata?.days_calculated;
  const dailyRate = invoice.metadata?.daily_rate;
  const fullAmount = invoice.metadata?.full_amount;
  const dateRange = invoice.metadata?.date_range;
  const utilitiesIncluded = invoice.metadata?.utilities_included || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <div className="text-sm font-medium text-gray-500">Property</div>
          <div>{invoice.property?.name}</div>
          <div className="text-sm text-gray-500">{invoice.property?.address}</div>
        </div>
        <div>
          <div className="text-sm font-medium text-gray-500">Tenant Email</div>
          <div className="text-sm text-gray-500">{invoice.tenant?.email || 'No email provided'}</div>
        </div>
        {userRole === "landlord" && (
          <div>
            <div className="text-sm font-medium text-gray-500">Tenant</div>
            <div>
              {invoice.tenant?.first_name} {invoice.tenant?.last_name}
            </div>
            <div className="text-sm text-gray-500">{invoice.tenant?.email}</div>
          </div>
        )}
        <div>
          <div className="text-sm font-medium text-gray-500">Amount</div>
          <div>{formatAmount(invoice.amount, invoice.currency)}</div>
          {isPartialInvoice && fullAmount && calculationMethod === 'percentage' && partialPercentage && (
            <div className="text-xs text-gray-500">
              {partialPercentage}% of {formatAmount(fullAmount, invoice.currency)}
            </div>
          )}
          {isPartialInvoice && fullAmount && calculationMethod === 'days' && daysCalculated && dailyRate && (
            <div className="text-xs text-gray-500">
              {daysCalculated} days at {formatAmount(dailyRate, invoice.currency)}/day from {formatAmount(fullAmount, invoice.currency)}/month
            </div>
          )}
        </div>
        <div>
          <div className="text-sm font-medium text-gray-500">Due Date</div>
          <div>{format(new Date(invoice.due_date), 'PPP')}</div>
        </div>
        <div>
          <Badge variant={invoice.status === "paid" ? "default" : "secondary"}>
            {invoice.status}
          </Badge>
          {isPartialInvoice && (
            <Badge variant="outline" className="ml-2">
              {calculationMethod === 'days' ? `Partial (${daysCalculated} days)` : 'Partial'}
            </Badge>
          )}
        </div>
        {dateRange && (
          <div>
            <div className="text-sm font-medium text-gray-500">Billing Period</div>
            <div className="text-sm">
              {format(new Date(dateRange.from), 'PPP')} to {format(new Date(dateRange.to), 'PPP')}
            </div>
          </div>
        )}
      </div>
      
      {utilitiesIncluded && utilitiesIncluded.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Included Utilities</h4>
          <div className="border rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  {userRole === "landlord" && (
                    <th scope="col" className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {utilitiesIncluded.map((utility, index) => (
                  <tr key={utility.id || index}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 capitalize">{utility.type}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(utility.due_date), 'PP')}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatAmount(utility.amount, invoice.currency)}
                    </td>
                    {userRole === "landlord" && (
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-center">
                        {utility.percentage && utility.original_amount ? (
                          <span>{utility.percentage}% of {formatAmount(utility.original_amount, invoice.currency)}</span>
                        ) : (
                          <span>Full amount</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
