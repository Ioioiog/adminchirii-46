
import { UtilityForInvoice } from "@/types/invoice";
import { UtilityItem } from "./UtilityItem";

interface UtilitiesSectionProps {
  utilities: UtilityForInvoice[];
  calculationData?: { utilities?: UtilityForInvoice[] };
  onUtilitySelection: (id: string, selected: boolean) => void;
  onUtilityPercentageChange: (id: string, percentage: number) => void;
  getAdjustedUtilityAmount: (utility: UtilityForInvoice) => number;
  invoiceCurrency: string;
}

export const UtilitiesSection = ({
  utilities,
  calculationData,
  onUtilitySelection,
  onUtilityPercentageChange,
  getAdjustedUtilityAmount,
  invoiceCurrency
}: UtilitiesSectionProps) => {
  if (!utilities || utilities.length === 0) return null;
  
  return (
    <div className="mt-3 pt-2 border-t">
      <h4 className="text-sm font-medium mb-2">Utilities:</h4>
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {utilities.map((utility) => {
          const isFromCalculator = calculationData?.utilities?.some(u => u.id === utility.id);
          
          return (
            <UtilityItem
              key={utility.id}
              utility={utility}
              isFromCalculator={!!isFromCalculator}
              onSelect={onUtilitySelection}
              onPercentageChange={onUtilityPercentageChange}
              getAdjustedUtilityAmount={getAdjustedUtilityAmount}
              invoiceCurrency={invoiceCurrency}
            />
          );
        })}
      </div>
    </div>
  );
};
