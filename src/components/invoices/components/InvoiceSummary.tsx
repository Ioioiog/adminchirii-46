
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatAmount } from "@/lib/utils";
import { CalculationData, UtilityForInvoice } from "@/types/invoice";
import { format } from "date-fns";
import { Calculator } from "lucide-react";
import { UtilitiesSection } from "./UtilitiesSection";
import { useCurrency } from "@/hooks/useCurrency";

interface InvoiceSummaryProps {
  calculationData?: CalculationData;
  invoiceCurrency: string;
  rentAlreadyInvoiced: boolean;
  applyVat: boolean;
  vatRate: number;
  vatAmount: number;
  grandTotal: number;
  utilities: UtilityForInvoice[];
  onUtilitySelection: (id: string, selected: boolean) => void;
  getAdjustedUtilityAmount: (utility: UtilityForInvoice) => number;
  formAmount: number;
  calculateTotal: () => number;
  isSubmitting: boolean;
  hasSelectedProperty: boolean;
  onSubmit: () => void;
}

export const InvoiceSummary = ({
  calculationData,
  invoiceCurrency,
  rentAlreadyInvoiced,
  applyVat,
  vatRate,
  vatAmount,
  grandTotal,
  utilities,
  onUtilitySelection,
  getAdjustedUtilityAmount,
  formAmount,
  calculateTotal,
  isSubmitting,
  hasSelectedProperty,
  onSubmit
}: InvoiceSummaryProps) => {
  const { convertCurrency } = useCurrency();
  const totalAmount = calculationData?.grandTotal || calculateTotal();
  
  // For display purposes, use the calculation rent amount if explicitly provided
  const rentAmount = calculationData?.rentAmount || formAmount || 0;
  
  // Determine if we have currency conversion
  const hasOriginalCurrency = calculationData?.currency && 
                             calculationData.currency !== invoiceCurrency;
  
  // Original property currency (from calculationData or property)
  const propertyCurrency = calculationData?.currency || invoiceCurrency;
  
  // Log values for debugging
  console.log('InvoiceSummary debug:', {
    rentAmount,
    formAmount,
    calculationRentAmount: calculationData?.rentAmount,
    originalCurrency: propertyCurrency,
    invoiceCurrency,
    hasOriginalCurrency,
    totalAmount
  });
  
  return (
    <>
      <Card className="border bg-slate-100">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3">
            <h3 className="text-md font-medium flex items-center gap-2">
              <Calculator className="h-5 w-5 text-slate-500" />
              Invoice Summary ({invoiceCurrency})
            </h3>

            <div className="space-y-2 bg-white p-4 rounded-md border">
              {calculationData?.dateRange && (
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm">Period:</span>
                  <span className="text-sm font-medium">
                    {format(calculationData.dateRange.from, 'MMM d, yyyy')} to {format(calculationData.dateRange.to, 'MMM d, yyyy')}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between items-center py-1">
                <span className="text-sm">Rent Amount:</span>
                <div className="text-right">
                  {rentAlreadyInvoiced ? (
                    <span className="text-sm text-amber-600">Already invoiced</span>
                  ) : (
                    <>
                      <span className="text-sm font-medium" data-testid="rent-amount">
                        {formatAmount(rentAmount, invoiceCurrency)}
                      </span>
                      {hasOriginalCurrency && propertyCurrency && (
                        <div className="text-xs text-gray-500">
                          Originally {formatAmount(formAmount, propertyCurrency)}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {applyVat && !rentAlreadyInvoiced && (
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm">VAT ({vatRate}%):</span>
                  <span className="text-sm font-medium">
                    {formatAmount(vatAmount, invoiceCurrency)}
                  </span>
                </div>
              )}

              <UtilitiesSection
                utilities={utilities}
                calculationData={calculationData}
                onUtilitySelection={onUtilitySelection}
                getAdjustedUtilityAmount={getAdjustedUtilityAmount}
                invoiceCurrency={invoiceCurrency}
              />

              <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-200">
                <span className="font-bold">Total Amount:</span>
                <span className="text-lg font-bold">
                  {formatAmount(totalAmount, invoiceCurrency)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={isSubmitting || !hasSelectedProperty || (
            totalAmount === 0 ||
            (!formAmount && !utilities.some(u => u.selected))
          )}
          onClick={onSubmit}
        >
          Create Invoice
        </Button>
      </div>
    </>
  );
};
