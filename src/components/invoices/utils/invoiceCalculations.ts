
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
  
  // First convert base amount to invoice currency
  let convertedBaseAmount = baseAmount;
  if (rentCurrency !== invoiceCurrency) {
    convertedBaseAmount = convertCurrency(baseAmount, rentCurrency, invoiceCurrency);
    console.log(`VAT calculation: Converted ${baseAmount} ${rentCurrency} to ${convertedBaseAmount} ${invoiceCurrency}`);
  }
  
  // Then calculate VAT on the converted amount
  const vatAmount = convertedBaseAmount * (vatRate / 100);
  console.log(`VAT calculation: ${convertedBaseAmount} × ${vatRate}% = ${vatAmount}`);
  
  return vatAmount;
};

export const getAdjustedUtilityAmount = (
  utility: UtilityForInvoice,
  calculationData?: { utilities?: UtilityForInvoice[] }
): number => {
  if (!utility.selected) return 0;
  
  // If this utility comes from the calculator, use its amount directly
  if (calculationData?.utilities?.some(u => u.id === utility.id)) {
    return utility.amount;
  }
  
  // Simply use the remaining amount
  const originalAmount = utility.original_amount || utility.amount;
  const remainingAmount = originalAmount - (utility.invoiced_amount || 0);
  
  // Ensure we're not returning 0
  return remainingAmount > 0 ? remainingAmount : originalAmount;
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
