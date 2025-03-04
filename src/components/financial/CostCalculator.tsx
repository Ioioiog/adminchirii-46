import React, { useState, useEffect } from 'react';
import { DateRange } from 'react-day-picker';
import { format, addDays, differenceInDays, isSameDay, addMonths, isWithinInterval } from 'date-fns';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Calculator, DollarSign, Info, CheckSquare, FileText, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useProperties } from '@/hooks/useProperties';
import { useUserRole } from '@/hooks/use-user-role';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useCurrency } from '@/hooks/useCurrency';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { InvoiceDialog } from '@/components/invoices/InvoiceDialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InvoiceMetadata } from '@/types/invoice';

interface UtilityItem {
  id: string;
  type: string;
  invoice_number: string;
  issued_date: string;
  due_date: string;
  amount: number;
  currency: string;
  selected?: boolean;
  invoiced_amount?: number;
}

interface LandlordProfile {
  id: string;
  invoice_info?: {
    apply_vat?: boolean;
    vat_rate?: number;
  };
}

const UtilityRow = ({ utility, getOriginalUtilityAmount, getAdjustedUtilityAmount, formatCurrency, onSelectionChange }: {
  utility: UtilityItem;
  getOriginalUtilityAmount: (utility: UtilityItem) => number;
  getAdjustedUtilityAmount: (utility: UtilityItem) => number;
  formatCurrency: (amount: number, currency: string) => string;
  onSelectionChange: (id: string, selected: boolean) => void;
}) => {
  return (
    <>
      <tr className={`border-t ${!utility.selected ? 'bg-gray-50 text-gray-400' : ''}`}>
        <td className="p-3">{utility.type}</td>
        <td className="p-3">{utility.invoice_number}</td>
        <td className="p-3">{utility.issued_date}</td>
        <td className="p-3">{utility.due_date}</td>
        <td className="p-3 text-center">
          <Checkbox 
            checked={utility.selected}
            onCheckedChange={(checked) => onSelectionChange(utility.id, !!checked)}
            className="mx-auto"
          />
        </td>
        <td className="p-3 text-right font-medium">
          {formatCurrency(utility.amount, utility.currency)}
          {utility.invoiced_amount && utility.invoiced_amount > 0 && (
            <div className="text-xs text-gray-500">
              ({formatCurrency(utility.invoiced_amount, utility.currency)} invoiced)
            </div>
          )}
        </td>
        <td className="p-3 text-right font-medium">
          {utility.selected ? formatCurrency(getAdjustedUtilityAmount(utility), utility.currency) : '-'}
        </td>
      </tr>
    </>
  );
};

const CostCalculator = () => {
  const { userRole, userId } = useUserRole();
  const { properties } = useProperties({ userRole: userRole || 'tenant' });
  const { availableCurrencies } = useCurrency();
  
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>(undefined);
  const [rentAmount, setRentAmount] = useState<number>(0);
  const [rentCalculationType, setRentCalculationType] = useState<'full' | 'daily'>('daily');
  const [utilities, setUtilities] = useState<UtilityItem[]>([]);
  const [hasCalculated, setHasCalculated] = useState<boolean>(false);
  const [rentCurrency, setRentCurrency] = useState<string>('RON');
  const [totalUtilitiesByCurrency, setTotalUtilitiesByCurrency] = useState<Record<string, number>>({});
  const [daysInPeriod, setDaysInPeriod] = useState<number>(0);
  const [isFullMonth, setIsFullMonth] = useState<boolean>(false);
  const [applyVat, setApplyVat] = useState<boolean>(false);
  const [vatRate, setVatRate] = useState<number>(19);
  const [vatAmount, setVatAmount] = useState<number>(0);
  const [grandTotalCurrency, setGrandTotalCurrency] = useState<string>('RON');
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [landlordId, setLandlordId] = useState<string>('');
  const [rentAlreadyInvoiced, setRentAlreadyInvoiced] = useState<boolean>(false);
  const [invoicedPeriod, setInvoicedPeriod] = useState<{from: Date, to: Date} | null>(null);

  useEffect(() => {
    if (selectedPropertyId) {
      const property = properties.find(p => p.id === selectedPropertyId);
      setSelectedProperty(property);
      if (property) {
        setRentCurrency(property.currency || 'RON');
        setGrandTotalCurrency(property.currency || 'RON');
        fetchLandlordVatSettings(property.landlord_id);
        setLandlordId(property.landlord_id);
      }
    }
  }, [selectedPropertyId, properties]);

  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-exchange-rates');
        
        if (error) {
          console.error('Error fetching exchange rates:', error);
          return;
        }
        
        if (data && data.rates) {
          setExchangeRates(data.rates);
        }
      } catch (error) {
        console.error('Error in exchange rates fetch:', error);
      }
    };
    
    fetchExchangeRates();
  }, []);

  const fetchLandlordVatSettings = async (landlordId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('invoice_info')
        .eq('id', landlordId)
        .single();

      if (error) {
        console.error('Error fetching landlord profile:', error);
        return;
      }

      if (data && data.invoice_info) {
        const invoiceInfo = data.invoice_info as LandlordProfile['invoice_info'];
        setApplyVat(!!invoiceInfo.apply_vat);
        setVatRate(invoiceInfo.vat_rate || 19);
      } else {
        setApplyVat(false);
        setVatRate(19);
      }
    } catch (error) {
      console.error('Error processing landlord VAT settings:', error);
      setApplyVat(false);
    }
  };

  useEffect(() => {
    if (selectedDateRange?.from && selectedDateRange?.to) {
      const days = differenceInDays(selectedDateRange.to, selectedDateRange.from) + 1;
      setDaysInPeriod(days);
      
      const fromDate = selectedDateRange.from;
      const nextMonth = addMonths(fromDate, 1);
      const isOneMonthApart = isSameDay(nextMonth, selectedDateRange.to) || 
                             (fromDate.getDate() === selectedDateRange.to.getDate() && 
                              nextMonth.getMonth() === selectedDateRange.to.getMonth());
      
      setIsFullMonth(isOneMonthApart);
      setRentCalculationType(isOneMonthApart ? 'full' : 'daily');
    }
  }, [selectedDateRange]);

  const checkExistingInvoices = async () => {
    if (!selectedPropertyId || !selectedDateRange?.from || !selectedDateRange?.to) {
      return;
    }
    
    try {
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*,metadata')
        .eq('property_id', selectedPropertyId);
      
      if (error) {
        console.error('Error checking existing invoices:', error);
        return;
      }
      
      const overlappingInvoices = invoices.filter(invoice => {
        if (!invoice.metadata) return false;
        
        const metadata = invoice.metadata as unknown as InvoiceMetadata;
        if (!metadata.date_range) return false;
        
        const invoiceFrom = new Date(metadata.date_range.from);
        const invoiceTo = new Date(metadata.date_range.to);
        
        return (
          isWithinInterval(selectedDateRange.from, { start: invoiceFrom, end: invoiceTo }) ||
          isWithinInterval(selectedDateRange.to, { start: invoiceFrom, end: invoiceTo }) ||
          isWithinInterval(invoiceFrom, { start: selectedDateRange.from, end: selectedDateRange.to }) ||
          isWithinInterval(invoiceTo, { start: selectedDateRange.from, end: selectedDateRange.to })
        );
      });
      
      if (overlappingInvoices.length > 0) {
        setRentAlreadyInvoiced(true);
        const mostRecentInvoice = overlappingInvoices.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        
        if (mostRecentInvoice.metadata) {
          const metadata = mostRecentInvoice.metadata as unknown as InvoiceMetadata;
          
          if (metadata.date_range) {
            setInvoicedPeriod({
              from: new Date(metadata.date_range.from),
              to: new Date(metadata.date_range.to)
            });
          }
        }
      } else {
        setRentAlreadyInvoiced(false);
        setInvoicedPeriod(null);
      }
    } catch (error) {
      console.error('Error in checkExistingInvoices:', error);
    }
  };

  const calculateCosts = async () => {
    if (!selectedPropertyId || !selectedDateRange?.from || !selectedDateRange?.to) {
      return;
    }

    await checkExistingInvoices();

    const days = daysInPeriod;
    const monthlyRent = selectedProperty?.monthly_rent || 0;
    
    let periodRent;
    if (rentAlreadyInvoiced) {
      periodRent = 0;
    } else {
      if (rentCalculationType === 'full') {
        periodRent = monthlyRent;
      } else {
        const dailyRent = monthlyRent / 30;
        periodRent = dailyRent * days;
      }
    }
    
    let calculatedVatAmount = 0;
    if (applyVat && !rentAlreadyInvoiced) {
      calculatedVatAmount = (periodRent * vatRate) / 100;
      setVatAmount(Math.round(calculatedVatAmount * 100) / 100);
    } else {
      setVatAmount(0);
    }
    
    setRentAmount(Math.round(periodRent * 100) / 100);

    const { data: utilitiesData, error } = await supabase
      .from('utilities')
      .select('*')
      .eq('property_id', selectedPropertyId)
      .gte('issued_date', selectedDateRange.from.toISOString().split('T')[0])
      .lte('issued_date', selectedDateRange.to.toISOString().split('T')[0]);

    if (error) {
      console.error('Error fetching utilities:', error);
      return;
    }

    const formattedUtilities = utilitiesData?.map(utility => {
      const remainingAmount = utility.amount - (utility.invoiced_amount || 0);
      
      return {
        id: utility.id,
        type: utility.type,
        invoice_number: utility.invoice_number || '-',
        issued_date: utility.issued_date ? format(new Date(utility.issued_date), 'MM/dd/yyyy') : '-',
        due_date: format(new Date(utility.due_date), 'MM/dd/yyyy'),
        amount: utility.amount,
        currency: utility.currency || rentCurrency,
        selected: remainingAmount > 0,
        invoiced_amount: utility.invoiced_amount || 0
      };
    }) || [];

    recalculateUtilityTotals(formattedUtilities);
    setUtilities(formattedUtilities);
    setHasCalculated(true);
  };

  const recalculateUtilityTotals = (updatedUtilities: UtilityItem[]) => {
    const utilitiesByCurrency: Record<string, number> = {};
    
    updatedUtilities.forEach(utility => {
      if (utility.selected) {
        const currency = utility.currency;
        const adjustedAmount = getAdjustedUtilityAmount(utility);
        
        if (!utilitiesByCurrency[currency]) {
          utilitiesByCurrency[currency] = 0;
        }
        utilitiesByCurrency[currency] += adjustedAmount;
      }
    });

    Object.keys(utilitiesByCurrency).forEach(currency => {
      utilitiesByCurrency[currency] = Math.round(utilitiesByCurrency[currency] * 100) / 100;
    });

    setTotalUtilitiesByCurrency(utilitiesByCurrency);
  };

  const handleUtilitySelectionChange = (id: string, isSelected: boolean) => {
    const updatedUtilities = utilities.map(utility => {
      if (utility.id === id) {
        return { ...utility, selected: isSelected };
      }
      return utility;
    });
    
    setUtilities(updatedUtilities);
    recalculateUtilityTotals(updatedUtilities);
  };

  const formatCurrency = (amount: number, currency: string) => {
    return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getRentWithVat = () => {
    return rentAmount + vatAmount;
  };

  const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
    if (fromCurrency === toCurrency) return amount;
    if (!exchangeRates || Object.keys(exchangeRates).length === 0) return amount;
    
    let amountInRON = amount;
    if (fromCurrency !== 'RON') {
      amountInRON = amount * (exchangeRates[fromCurrency] || 1);
    }
    
    if (toCurrency === 'RON') {
      return amountInRON;
    }
    
    return amountInRON / (exchangeRates[toCurrency] || 1);
  };

  const calculateGrandTotal = (): number => {
    let total = 0;
    
    // Only include rent in the total if it hasn't already been invoiced
    if (rentCurrency && !rentAlreadyInvoiced) {
      const rentWithVat = applyVat ? getRentWithVat() : rentAmount;
      total += convertCurrency(rentWithVat, rentCurrency, grandTotalCurrency);
    }
    
    Object.entries(totalUtilitiesByCurrency).forEach(([currency, amount]) => {
      total += convertCurrency(amount, currency, grandTotalCurrency);
    });
    
    return Math.round(total * 100) / 100;
  };

  const getOriginalUtilityAmount = (utility: UtilityItem): number => {
    return utility.amount;
  };

  const getAdjustedUtilityAmount = (utility: UtilityItem): number => {
    if (!utility.selected) return 0;
    
    // Calculate the remaining amount that can be invoiced
    const remainingAmount = utility.amount - (utility.invoiced_amount || 0);
    return Math.max(0, remainingAmount);
  };

  const createInvoiceFromCalculation = () => {
    if (!selectedPropertyId || !selectedProperty || !userId) {
      toast({
        title: "Missing information",
        description: "Please select a property and calculate costs first.",
        variant: "destructive",
      });
      return;
    }

    const selectedUtilities = utilities
      .filter(utility => utility.selected)
      .map(utility => ({
        id: utility.id,
        type: utility.type,
        amount: getAdjustedUtilityAmount(utility),
        original_amount: utility.amount,
        currency: utility.currency,
        due_date: utility.due_date,
        invoiced_amount: utility.invoiced_amount || 0
      }));

    const dateRangeForInvoice = selectedDateRange && 
      selectedDateRange.from && 
      selectedDateRange.to ? {
        from: selectedDateRange.from,
        to: selectedDateRange.to
      } : undefined;

    const calculationData = {
      propertyId: selectedPropertyId,
      rentAmount: rentAmount + vatAmount,
      dateRange: dateRangeForInvoice,
      currency: grandTotalCurrency,
      grandTotal: calculateGrandTotal(),
      utilities: selectedUtilities
    };

    setShowInvoiceDialog(true);
  };

  useEffect(() => {
    if (utilities.length > 0) {
      recalculateUtilityTotals(utilities);
    }
  }, [utilities]);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-2">
        <Calendar className="h-8 w-8" />
        <h3 className="text-2xl font-bold">Cost Calculator</h3>
      </div>
      
      <p className="text-gray-600">
        Select a property and date range to calculate your total expenses (rent + utilities)
      </p>
      
      <div className="space-y-4">
        <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a property" />
          </SelectTrigger>
          <SelectContent>
            {properties.map((property) => (
              <SelectItem key={property.id} value={property.id}>
                {property.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="w-full sm:w-3/4">
            <DatePickerWithRange
              date={selectedDateRange}
              onDateChange={setSelectedDateRange}
            />
          </div>
          <Button 
            onClick={calculateCosts} 
            disabled={!selectedPropertyId || !selectedDateRange?.from || !selectedDateRange?.to}
            className="w-full sm:w-1/4"
            size="lg"
          >
            <Calculator className="mr-2 h-4 w-4" />
            Calculate
          </Button>
        </div>
      </div>
      
      {hasCalculated && (
        <div>
          <Card className="bg-blue-50 border-blue-100">
            <CardContent className="p-6">
              <h4 className="text-xl font-semibold text-center mb-4">
                Cost Summary for {format(selectedDateRange?.from || new Date(), "MMM d, yyyy")} to {format(selectedDateRange?.to || addDays(new Date(), 1), "MMM d, yyyy")}
              </h4>
              
              {rentAlreadyInvoiced && invoicedPeriod && (
                <Alert className="mb-4 bg-amber-50 border-amber-200">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-amber-800">Rent already invoiced</AlertTitle>
                  <AlertDescription className="text-amber-700">
                    Rent has already been invoiced for this property from {format(invoicedPeriod.from, 'MMM d, yyyy')} to {format(invoicedPeriod.to, 'MMM d, yyyy')}.
                    Only utilities will be included in this calculation.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <p className="text-gray-600">Rent</p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="p-2 max-w-xs">
                            {rentAlreadyInvoiced ? (
                              <p className="font-semibold text-amber-600">Rent already invoiced for this period</p>
                            ) : (
                              <>
                                <p className="font-semibold">Rent Calculation:</p>
                                <p className="text-sm">
                                  {rentCalculationType === 'full' 
                                    ? 'Full month rent applied (same day of consecutive months)' 
                                    : `Daily rate (monthly rent ÷ 30) × ${daysInPeriod} days`}
                                </p>
                                {rentCalculationType === 'daily' && (
                                  <p className="text-xs mt-1">
                                    {formatCurrency(selectedProperty?.monthly_rent / 30, rentCurrency)} × {daysInPeriod} days
                                  </p>
                                )}
                                {applyVat && (
                                  <p className="text-xs mt-1">
                                    VAT ({vatRate}%): {formatCurrency(vatAmount, rentCurrency)}
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-xl font-bold">
                    {rentAlreadyInvoiced ? (
                      <span className="text-amber-600">Already invoiced</span>
                    ) : (
                      <>
                        {formatCurrency(rentAmount, rentCurrency)}
                        {applyVat && (
                          <span className="block text-sm text-gray-600">
                            + {formatCurrency(vatAmount, rentCurrency)} VAT
                          </span>
                        )}
                      </>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
                    {rentAlreadyInvoiced ? 
                      'Excluded from calculation' : 
                      (rentCalculationType === 'full' 
                        ? 'Full monthly rent' 
                        : `${daysInPeriod} days period`)}
                  </p>
                </div>
                
                <div className="text-center">
                  <p className="text-gray-600">Utilities</p>
                  <div>
                    {Object.entries(totalUtilitiesByCurrency).map(([currency, amount]) => (
                      <p key={currency} className="text-xl font-bold">
                        {formatCurrency(amount, currency)}
                      </p>
                    ))}
                    {Object.keys(totalUtilitiesByCurrency).length === 0 && (
                      <p className="text-xl font-bold">{formatCurrency(0, rentCurrency)}</p>
                    )}
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-gray-600">Total</p>
                  <div>
                    {!rentAlreadyInvoiced ? (
                      <p className="text-xl font-bold text-blue-600">
                        {applyVat
                          ? formatCurrency(getRentWithVat(), rentCurrency)
                          : formatCurrency(rentAmount, rentCurrency)}
                      </p>
                    ) : (
                      <p className="text-xl font-bold text-blue-600">
                        {formatCurrency(0, rentCurrency)}
                        <span className="block text-xs text-amber-600">(Rent excluded)</span>
                      </p>
                    )}
                    {Object.entries(totalUtilitiesByCurrency).map(([currency, amount]) => (
                      <div key={currency}>
                        {currency === rentCurrency ? (
                          <p className="text-lg font-bold text-blue-600">
                            = {formatCurrency(rentAlreadyInvoiced ? amount : amount + (applyVat ? getRentWithVat() : rentAmount), currency)}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-500">
                            + {formatCurrency(amount, currency)} <span className="text-xs">(different currency)</span>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-blue-200">
                <div className="flex flex-col items-center space-y-3">
                  <div className="flex items-center gap-3">
                    <h5 className="text-lg font-bold text-gray-800">Grand Total in:</h5>
                    <Select value={grandTotalCurrency} onValueChange={setGrandTotalCurrency}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCurrencies?.map((curr) => (
                          <SelectItem key={curr.code} value={curr.code}>
                            {curr.code} - {curr.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="text-2xl font-bold text-blue-700 bg-blue-100 px-6 py-2 rounded-lg shadow-sm">
                    {formatCurrency(calculateGrandTotal(), grandTotalCurrency)}
                  </div>
                  <p className="text-xs text-gray-500">
                    Converted using current exchange rates from BNR (National Bank of Romania)
                  </p>
                  {userRole === 'landlord' && (
                    <Button 
                      onClick={createInvoiceFromCalculation}
                      className="mt-4 bg-green-600 hover:bg-green-700"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Create Invoice
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {utilities.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h4 className="text-xl font-semibold mb-4">Utility Details & Customization</h4>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left p-3 text-gray-600">TYPE</th>
                        <th className="text-left p-3 text-gray-600">INVOICE #</th>
                        <th className="text-left p-3 text-gray-600">ISSUED DATE</th>
                        <th className="text-left p-3 text-gray-600">DUE DATE</th>
                        <th className="text-center p-3 text-gray-600">INCLUDED</th>
                        <th className="text-right p-3 text-gray-600">ORIGINAL AMOUNT</th>
                        <th className="text-right p-3 text-gray-600">APPLIED AMOUNT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {utilities.map((utility) => (
                        <UtilityRow 
                          key={utility.id}
                          utility={utility}
                          getOriginalUtilityAmount={getOriginalUtilityAmount}
                          getAdjustedUtilityAmount={getAdjustedUtilityAmount}
                          formatCurrency={formatCurrency}
                          onSelectionChange={handleUtilitySelectionChange}
                        />
                      ))}
                      {Object.entries(totalUtilitiesByCurrency).map(([currency, amount]) => (
                        <tr key={currency} className="border-t font-bold">
                          <td colSpan={5} className="p-3 text-right">
                            Total Utilities ({currency}):
                          </td>
                          <td colSpan={2} className="p-3 text-right">{formatCurrency(amount, currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {showInvoiceDialog && userId && userRole && userRole !== 'service_provider' && (
        <InvoiceDialog 
          open={showInvoiceDialog}
          onOpenChange={setShowInvoiceDialog}
          userId={userId}
          userRole={userRole as "landlord" | "tenant"}
          onInvoiceCreated={async () => {
            setShowInvoiceDialog(false);
            toast({
              title: "Success",
              description: "Invoice created successfully.",
            });
          }}
          calculationData={{
            propertyId: selectedPropertyId,
            rentAmount: rentAmount + vatAmount,
            dateRange: selectedDateRange && 
              selectedDateRange.from && 
              selectedDateRange.to ? {
                from: selectedDateRange.from,
                to: selectedDateRange.to
              } : undefined,
            currency: grandTotalCurrency,
            grandTotal: calculateGrandTotal(),
            utilities: utilities
              .filter(util => util.selected)
              .map(util => ({
                id: util.id,
                type: util.type,
                amount: getAdjustedUtilityAmount(util),
                original_amount: util.amount,
                currency: util.currency,
                due_date: util.due_date,
                invoiced_amount: util.invoiced_amount || 0
              }))
          }}
        />
      )}
    </div>
  );
};

export default CostCalculator;
