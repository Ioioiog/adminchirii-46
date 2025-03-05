
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CurrencyPreference {
  currency_preference: string;
}

interface ExchangeRates {
  rates: {
    USD: number;
    EUR: number;
    RON: number;
  };
}

interface Currency {
  code: string;
  name: string;
}

const availableCurrencies: Currency[] = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'RON', name: 'Romanian Leu' }
];

const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string, rates: ExchangeRates['rates']): number => {
  if (fromCurrency === toCurrency) return amount;
  
  if (!rates || Object.keys(rates).length === 0) {
    console.warn('No exchange rates available, returning original amount:', amount);
    return amount;
  }
  
  console.log(`Converting ${amount} from ${fromCurrency} to ${toCurrency}`, {
    rates,
    fromRate: rates[fromCurrency as keyof typeof rates],
    toRate: rates[toCurrency as keyof typeof rates]
  });
  
  // For proper currency conversion, we need to understand the exchange rate format
  // In this case, the rates are relative to RON (Romanian Leu as the base currency)
  // So EUR rate means 1 EUR = X RON, and USD rate means 1 USD = Y RON
  
  try {
    // First convert to RON (base currency in our system)
    let amountInRON = amount;
    if (fromCurrency !== 'RON') {
      const fromRate = rates[fromCurrency as keyof typeof rates];
      if (!fromRate) {
        console.error(`Exchange rate for ${fromCurrency} not found`);
        return amount;
      }
      amountInRON = amount * fromRate;
      console.log(`Step 1: Converted ${amount} ${fromCurrency} to ${amountInRON.toFixed(2)} RON (rate: ${fromRate})`);
    }
    
    // Then convert from RON to target currency
    if (toCurrency === 'RON') {
      console.log(`Final amount in RON: ${amountInRON.toFixed(2)}`);
      return amountInRON;
    }
    
    const toRate = rates[toCurrency as keyof typeof rates];
    if (!toRate) {
      console.error(`Exchange rate for ${toCurrency} not found`);
      return amountInRON; // Return RON amount if target rate not found
    }
    
    const result = amountInRON / toRate;
    console.log(`Step 2: Converted ${amountInRON.toFixed(2)} RON to ${result.toFixed(2)} ${toCurrency} (rate: ${toRate})`);
    return result;
  } catch (error) {
    console.error("Error in currency conversion:", error);
    return amount; // Return original amount in case of error
  }
};

export function useCurrency() {
  // Fetch user's currency preference with no caching
  const { data: preference } = useQuery({
    queryKey: ["currency-preference"],
    queryFn: async () => {
      console.log('Fetching currency preference...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // Get the most up-to-date preference from localStorage if it exists
      const localCurrency = localStorage.getItem('currency');
      if (localCurrency) {
        console.log('Using currency from localStorage:', localCurrency);
        return { currency_preference: localCurrency };
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("currency_preference")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching currency preference:', error);
        return { currency_preference: 'USD' };
      }

      if (!data) {
        console.log('No profile found, creating one with default currency...');
        const { error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            currency_preference: 'USD',
            settings: {
              currency: 'USD',
              language: 'en',
              theme: 'light'
            }
          });

        if (insertError) {
          console.error('Error creating profile:', insertError);
        }

        return { currency_preference: 'USD' };
      }

      console.log('Using currency from database:', data.currency_preference);
      return data as CurrencyPreference;
    },
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache
  });

  // Fetch exchange rates with 24-hour caching
  const { data: exchangeRates } = useQuery<ExchangeRates>({
    queryKey: ["exchange-rates"],
    queryFn: async () => {
      console.log('Fetching exchange rates...');
      const { data, error } = await supabase.functions.invoke('get-exchange-rates');
      
      if (error) {
        console.error('Error fetching exchange rates:', error);
        // Fallback to default rates if API fails
        return {
          rates: {
            USD: 4.56,
            EUR: 4.97,
            RON: 1
          }
        };
      }

      console.log('Received exchange rates:', data.rates);
      return { rates: data.rates };
    },
    // Cache for 24 hours since rates don't change frequently
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 3,
  });

  const formatAmount = (amount: number, currencyCode: string = 'USD') => {
    const targetCurrency = preference?.currency_preference || 'USD';
    const rates = exchangeRates?.rates;

    if (!rates) {
      // If rates are not available, just format with the specified currency
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode || targetCurrency,
      }).format(amount);
    }

    // When a specific currency is provided, use it rather than converting
    if (currencyCode && currencyCode !== targetCurrency) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
      }).format(amount);
    }

    const convertedAmount = convertCurrency(amount, currencyCode, targetCurrency, rates);

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: targetCurrency,
    }).format(convertedAmount);
  };

  return {
    formatAmount,
    currency: preference?.currency_preference || 'USD',
    isLoading: !exchangeRates,
    availableCurrencies,
    convertCurrency: (amount: number, fromCurrency: string, toCurrency: string) => {
      if (!exchangeRates?.rates) return amount;
      return convertCurrency(amount, fromCurrency, toCurrency, exchangeRates.rates);
    }
  };
}
