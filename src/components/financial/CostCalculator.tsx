import React, { useState, useEffect } from 'react';
import { DateRange } from 'react-day-picker';
import { format, addDays, differenceInDays, isSameDay, addMonths } from 'date-fns';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Calculator, DollarSign, Info, Percent, CheckSquare, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useProperties } from '@/hooks/useProperties';
import { useUserRole } from '@/hooks/use-user-role';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useCurrency } from '@/hooks/useCurrency';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { InvoiceDialog } from '@/components/invoices/InvoiceDialog';

interface UtilityItem {
  id: string;
  type: string;
  invoice_number: string;
  issued_date: string;
  due_date: string;
  amount: number;
  currency: string;
  percentage?: number;
  selected?: boolean;
}

interface LandlordProfile {
  id: string;
  invoice_info?: {
    apply_vat?: boolean;
    vat_rate?: number;
  };
}

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

  const calculateCosts = async () => {
    if (!selectedPropertyId || !selectedDateRange?.from || !selectedDateRange?.to) {
      return;
    }

    const days = daysInPeriod;
    const monthlyRent = selectedProperty?.monthly_rent || 0;
    
    let periodRent;
    if (rentCalculationType === 'full') {
      periodRent = monthlyRent;
    } else {
      const dailyRent = monthlyRent / 30;
      periodRent = dailyRent * days;
    }
    
    let calculatedVatAmount = 0;
    if (applyVat) {
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

    const formattedUtilities = utilitiesData?.map(utility => ({
      id: utility.id,
      type: utility.type,
      invoice_number: utility.invoice_number || '-',
      issued_date: utility.issued_date ? format(new Date(utility.issued_date), 'MM/dd/yyyy') : '-',
      due_date: format(new Date(utility.due_date), 'MM/dd/yyyy'),
      amount: utility.amount,
      currency: utility.currency || rentCurrency,
      percentage: 100,
      selected: true
    })) || [];

    recalculateUtilityTotals(formattedUtilities);
    setUtilities(formattedUtilities);
    setHasCalculated(true);
  };

  const recalculateUtilityTotals = (updatedUtilities: UtilityItem[]) => {
    const utilitiesByCurrency: Record<string, number> = {};
    
    updatedUtilities.forEach(utility => {
      if (utility.selected) {
        const currency = utility.currency;
        const percentage = utility.percentage || 100;
        const adjustedAmount = (utility.amount * percentage) / 100;
        
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

  const handleUtilityPercentageChange = (id: string, newPercentage: number) => {
    const updatedUtilities = utilities.map(utility => {
      if (utility.id === id) {
        return { ...utility, percentage: newPercentage };
      }
      return utility;
    });
    
    setUtilities(updatedUtilities);
    recalculateUtilityTotals(updatedUtilities);
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
    
    if (rentCurrency) {
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
    const percentage = utility.percentage || 100;
    return (utility.amount * percentage) / 100;
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
        percentage: utility.percentage,
        original_amount: utility.amount
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
        <>
          <Card className="bg-blue-50 border-blue-100">
            <CardContent className="p-6">
              <h4 className="text-xl font-semibold text-center mb-4">
                Cost Summary for {format(selectedDateRange?.from || new Date(), "MMM d, yyyy")} to {format(selectedDateRange?.to || addDays(new Date(), 1), "MMM d, yyyy")}
              </h4>
              
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
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-xl font-bold">
                    {formatCurrency(rentAmount, rentCurrency)}
                    {applyVat && (
                      <span className="block text-sm text-gray-600">
                        + {formatCurrency(vatAmount, rentCurrency)} VAT
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
                    {rentCalculationType === 'full' 
                      ? 'Full monthly rent' 
                      : `${daysInPeriod} days period`}
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
                    <p className="text-xl font-bold text-blue-600">
                      {applyVat 
                        ? formatCurrency(getRentWithVat(), rentCurrency)
                        : formatCurrency(rentAmount, rentCurrency)}
                    </p>
                    {Object.entries(totalUtilitiesByCurrency).map(([currency, amount]) => (
                      <React.Fragment key={currency}>
                        {currency === rentCurrency ? (
                          <p className="text-lg font-bold text-blue-600">
                            = {formatCurrency(amount + (applyVat ? getRentWithVat() : rentAmount), currency)}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-500">
                            + {formatCurrency(amount, currency)} <span className="text-xs">(different currency)</span>
                          </p>
                        )}
                      </React.Fragment>
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
                        <th className="text-right p-3 text-gray-600">PERCENTAGE</th>
                        <th className="text-right p-3 text-gray-600">APPLIED AMOUNT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {utilities.map((utility) => (
                        <React.Fragment key={utility.id}>
                          <tr className={`border-t ${!utility.selected ? 'bg-gray-50 text-gray-400' : ''}`}>
                            <td className="p-3">{utility.type}</td>
                            <td className="p-3">{utility.invoice_number}</td>
                            <td className="p-3">{utility.issued_date}</td>
                            <td className="p-3">{utility.due_date}</td>
                            <td className="p-3 text-center">
                              <Checkbox 
                                checked={utility.selected}
                                onCheckedChange={(checked) => handleUtilitySelectionChange(utility.id, !!checked)}
                                className="mx-auto"
                              />
                            </td>
                            <td className="p-3 text-right font-medium">{formatCurrency(utility.amount, utility.currency)}</td>
                            <td className="p-3 text-right font-medium">
                              {utility.selected ? `${utility.percentage || 100}%` : '-'}
                            </td>
                            <td className="p-3 text-right font-medium">
                              {utility.selected ? formatCurrency(getAdjustedUtilityAmount(utility), utility.currency) : '-'}
                            </td>
                          </tr>
                          {utility.selected && (
                            <tr className="border-b border-dashed">
                              <td colSpan={8} className="p-3 bg-gray-50">
                                <div className="space-y-2 px-2">
                                  <div className="flex justify-between items-center text-xs text-gray-600">
                                    <span>0%</span>
                                    <span>50%</span>
                                    <span>100%</span>
                                  </div>
                                  <Slider
                                    value={[utility.percentage || 100]}
                                    onValueChange={(values) => handleUtilityPercentageChange(utility.id, values[0])}
                                    max={100}
                                    step={1}
                                    className="mt-1"
                                  />
                                  <div className="flex justify-between items-center">
                                    <span className="px-2 py-0.5 bg-blue-50 rounded-full text-xs font-medium text-blue-700">
                                      {utility.percentage || 100}%
                                    </span>
                                    <span className="text-sm font-medium">
                                      Applied: {formatCurrency(getAdjustedUtilityAmount(utility), utility.currency)}
                                    </span>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                      {Object.entries(totalUtilitiesByCurrency).map(([currency, amount]) => (
                        <tr key={currency} className="border-t font-bold">
                          <td colSpan={6} className="p-3 text-right">
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
        </>
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
                percentage: util.percentage,
                original_amount: util.amount
              }))
          }}
        />
      )}
    </div>
  );
};

export default CostCalculator;
