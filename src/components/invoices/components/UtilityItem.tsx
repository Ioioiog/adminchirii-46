
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { formatAmount } from "@/lib/utils";
import { UtilityForInvoice } from "@/types/invoice";

interface UtilityItemProps {
  utility: UtilityForInvoice;
  isFromCalculator: boolean;
  onSelect: (id: string, selected: boolean) => void;
  getAdjustedUtilityAmount: (utility: UtilityForInvoice) => number;
  invoiceCurrency: string;
}

export const UtilityItem = ({
  utility,
  isFromCalculator,
  onSelect,
  getAdjustedUtilityAmount,
  invoiceCurrency
}: UtilityItemProps) => {
  const isPartiallyInvoiced = utility.invoiced_amount > 0 && utility.invoiced_amount < (utility.original_amount || utility.amount);
  const originalAmount = utility.original_amount || utility.amount;
  const remainingAmount = originalAmount - (utility.invoiced_amount || 0);
  
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-start gap-2">
        <Checkbox 
          id={`utility-${utility.id}`}
          checked={utility.selected}
          onCheckedChange={(checked) => onSelect(utility.id, !!checked)}
          className="mt-1"
          disabled={isFromCalculator}
        />
        <div>
          <label htmlFor={`utility-${utility.id}`} className="text-sm cursor-pointer">
            {utility.type}
            {isPartiallyInvoiced && (
              <Badge className="ml-2 text-xs bg-amber-100 text-amber-800">
                Partially Invoiced ({formatAmount(utility.invoiced_amount || 0, utility.currency || invoiceCurrency)})
              </Badge>
            )}
            {isFromCalculator && (
              <Badge className="ml-2 text-xs bg-blue-100 text-blue-800">
                From Calculator
              </Badge>
            )}
          </label>
          {utility.selected && !isFromCalculator && (
            <div className="mt-1 text-xs text-gray-500">
              Amount: {formatAmount(getAdjustedUtilityAmount(utility), utility.currency || invoiceCurrency)}
            </div>
          )}
        </div>
      </div>
      <div className="text-right">
        <span className="text-sm font-medium">
          {formatAmount(
            isFromCalculator ? (utility.applied_amount !== undefined ? utility.applied_amount : utility.amount) : getAdjustedUtilityAmount(utility),
            utility.currency || invoiceCurrency
          )}
        </span>
        <div className="text-xs text-gray-500">
          {remainingAmount < originalAmount ? (
            <>
              <span>{formatAmount(remainingAmount, utility.currency || invoiceCurrency)}</span>
              <span className="mx-1">of</span>
            </>
          ) : null}
          <span>{formatAmount(originalAmount, utility.currency || invoiceCurrency)}</span>
          {remainingAmount < originalAmount && (
            <span className="ml-1">remaining</span>
          )}
        </div>
      </div>
    </div>
  );
};
