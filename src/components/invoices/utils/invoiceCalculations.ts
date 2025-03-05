
import { UtilityForInvoice } from "@/types/invoice";

export const calculateVatAmount = (
  baseAmount: number,
  vatRate: number,
  rentCurrency: string,
  invoiceCurrency: string,
  rentAlreadyInvoiced: boolean,
  convertCurrency: (amount: number, fromCurrency: string, toCurrency: string) => number
): number => {
  if (rentAlreadyInvoiced) return 0;
  
  let convertedBaseAmount = baseAmount;
  if (rentCurrency !== invoiceCurrency) {
    convertedBaseAmount = convertCurrency(baseAmount, rentCurrency, invoiceCurrency);
  }
  
  return convertedBaseAmount * (vatRate / 100);
};

export const getAdjustedUtilityAmount = (
  utility: UtilityForInvoice,
  calculationData?: { utilities?: UtilityForInvoice[] }
): number => {
  if (!utility.selected) return 0;
  
  if (calculationData?.utilities?.some(u => u.id === utility.id)) {
    return utility.amount;
  }
  
  const percentage = utility.percentage || 100;
  const originalAmount = utility.original_amount || utility.amount;
  const remainingAmount = originalAmount - (utility.invoiced_amount || 0);
  const adjustableAmount = remainingAmount;
  return (adjustableAmount * percentage) / 100;
};

export const calculateTotal = (
  baseAmount: number,
  rentCurrency: string,
  invoiceCurrency: string,
  utilities: UtilityForInvoice[],
  applyVat: boolean,
  vatAmount: number,
  rentAlreadyInvoiced: boolean,
  convertCurrency: (amount: number, fromCurrency: string, toCurrency: string) => number,
  getAdjustedUtilityAmount: (utility: UtilityForInvoice) => number
): number => {
  const effectiveBaseAmount = rentAlreadyInvoiced ? 0 : baseAmount;
  
  let convertedBaseAmount = effectiveBaseAmount;
  if (rentCurrency !== invoiceCurrency) {
    convertedBaseAmount = convertCurrency(effectiveBaseAmount, rentCurrency, invoiceCurrency);
  }
  
  const totalRentWithVat = applyVat ? (convertedBaseAmount + vatAmount) : convertedBaseAmount;
  
  let utilitiesTotal = 0;
  utilities
    .filter(util => util.selected)
    .forEach(util => {
      const utilAmount = getAdjustedUtilityAmount(util);
      
      const utilCurrency = util.currency || 'EUR';
      if (utilCurrency !== invoiceCurrency) {
        utilitiesTotal += convertCurrency(utilAmount, utilCurrency, invoiceCurrency);
      } else {
        utilitiesTotal += utilAmount;
      }
    });
  
  return totalRentWithVat + utilitiesTotal;
};
