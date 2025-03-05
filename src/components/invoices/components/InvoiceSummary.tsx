
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatAmount } from "@/lib/utils";
import { CalculationData, UtilityForInvoice } from "@/types/invoice";
import { format } from "date-fns";
import { Calculator, Clock, Euro, FileText, Tag } from "lucide-react";
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
  const { convertCurrency, formatAmount: formatCurrencyAmount } = useCurrency();
  const totalAmount = calculationData?.grandTotal || calculateTotal();
  
  // Original property currency (from calculationData or property)
  const propertyCurrency = calculationData?.currency || invoiceCurrency;
  
  // For display purposes, get the base rent amount (before any conversion)
  const baseRentAmount = calculationData?.rentAmount || formAmount || 0;
  
  // If the currencies are different, convert the amount to invoice currency
  // This is the amount that will be displayed as the primary amount and used for calculations
  let displayRentAmount = baseRentAmount;
  if (propertyCurrency !== invoiceCurrency) {
    displayRentAmount = convertCurrency(baseRentAmount, propertyCurrency, invoiceCurrency);
    console.log(`Converting rent for display: ${baseRentAmount} ${propertyCurrency} → ${displayRentAmount.toFixed(2)} ${invoiceCurrency}`);
  }
  
  // Determine if we have currency conversion
  const hasOriginalCurrency = propertyCurrency !== invoiceCurrency;
  
  // Log values for debugging
  console.log('InvoiceSummary debug:', {
    displayRentAmount,
    baseRentAmount,
    calculationRentAmount: calculationData?.rentAmount,
    originalCurrency: propertyCurrency,
    invoiceCurrency,
    hasOriginalCurrency,
    totalAmount,
    vatAmount,
    convertedAmount: hasOriginalCurrency ? displayRentAmount : baseRentAmount
  });
  
  return (
    <>
      <Card className="border bg-gradient-to-br from-slate-50 to-slate-100 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-800 border-b pb-2">
              <Calculator className="h-5 w-5 text-blue-500" />
              Invoice Summary 
              <span className="text-sm font-normal ml-1 text-slate-500">({invoiceCurrency})</span>
            </h3>

            <div className="space-y-3 bg-white p-5 rounded-md border shadow-sm">
              {calculationData?.dateRange && (
                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                  <span className="text-sm flex items-center gap-1.5 text-slate-600">
                    <Clock className="h-4 w-4 text-slate-400" /> 
                    Period:
                  </span>
                  <span className="text-sm font-medium">
                    {format(calculationData.dateRange.from, 'MMM d, yyyy')} to {format(calculationData.dateRange.to, 'MMM d, yyyy')}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-sm flex items-center gap-1.5 text-slate-600">
                  <FileText className="h-4 w-4 text-slate-400" />
                  Rent Amount:
                </span>
                <div className="text-right">
                  {rentAlreadyInvoiced ? (
                    <span className="text-sm text-amber-600 italic">Already invoiced</span>
                  ) : (
                    <>
                      <span className="text-sm font-medium" data-testid="rent-amount">
                        {formatCurrencyAmount(displayRentAmount, invoiceCurrency)}
                      </span>
                      {hasOriginalCurrency && (
                        <div className="text-xs text-gray-500">
                          Originally {formatCurrencyAmount(baseRentAmount, propertyCurrency)}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {applyVat && !rentAlreadyInvoiced && (
                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                  <span className="text-sm flex items-center gap-1.5 text-slate-600">
                    <Tag className="h-4 w-4 text-slate-400" />
                    VAT ({vatRate}%):
                  </span>
                  <span className="text-sm font-medium">
                    {formatCurrencyAmount(vatAmount, invoiceCurrency)}
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

              <div className="flex justify-between items-center pt-3 mt-2 border-t border-slate-200 bg-slate-50 p-2 rounded">
                <span className="font-bold flex items-center gap-1.5 text-slate-800">
                  <Euro className="h-4 w-4 text-blue-500" />
                  Total Amount:
                </span>
                <span className="text-lg font-bold text-blue-600">
                  {formatCurrencyAmount(totalAmount, invoiceCurrency)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end mt-4">
        <Button 
          type="submit" 
          className="bg-blue-600 hover:bg-blue-700"
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
