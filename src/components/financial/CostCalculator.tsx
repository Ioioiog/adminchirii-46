import React, { useState, useEffect } from 'react';
import { DateRange } from 'react-day-picker';
import { format, addDays, differenceInDays, isSameDay, addMonths, isWithinInterval } from 'date-fns';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
  Calculator, 
  DollarSign, 
  Info, 
  CheckSquare, 
  FileText, 
  AlertCircle, 
  Edit2,
  Building,
  CalendarRange
} from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

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
  applied_amount?: number;
  isEditing?: boolean;
}

interface LandlordProfile {
  id: string;
  invoice_info?: {
    apply_vat?: boolean;
    vat_rate?: number;
  };
}

const UtilityRow = ({ 
  utility, 
  getOriginalUtilityAmount, 
  getAdjustedUtilityAmount, 
  formatCurrency, 
  onSelectionChange,
  onAppliedAmountChange
}: {
  utility: UtilityItem;
  getOriginalUtilityAmount: (utility: UtilityItem) => number;
  getAdjustedUtilityAmount: (utility: UtilityItem) => number;
  formatCurrency: (amount: number, currency: string) => string;
  onSelectionChange: (id: string, selected: boolean) => void;
  onAppliedAmountChange: (id: string, amount: number) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editAmount, setEditAmount] = useState(getAdjustedUtilityAmount(utility).toString());
  
  const toggleEdit = () => {
    if (isEditing) {
      const newAmount = parseFloat(editAmount);
      if (!isNaN(newAmount) && newAmount >= 0 && newAmount <= (utility.amount - (utility.invoiced_amount || 0))) {
        onAppliedAmountChange(utility.id, newAmount);
      } else {
        setEditAmount(getAdjustedUtilityAmount(utility).toString());
        toast({
          title: "Invalid amount",
          description: "Please enter a valid amount not exceeding the remaining balance.",
          variant: "destructive",
        });
      }
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditAmount(e.target.value);
  };

  const handleBlur = () => {
    const newAmount = parseFloat(editAmount);
    if (!isNaN(newAmount) && newAmount >= 0 && newAmount <= (utility.amount - (utility.invoiced_amount || 0))) {
      onAppliedAmountChange(utility.id, newAmount);
      setIsEditing(false);
    } else {
      setEditAmount(getAdjustedUtilityAmount(utility).toString());
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount not exceeding the remaining balance.",
        variant: "destructive",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setEditAmount(getAdjustedUtilityAmount(utility).toString());
      setIsEditing(false);
    }
  };

  const remainingAmount = utility.amount - (utility.invoiced_amount || 0);
  const hasBeenPartiallyInvoiced = utility.invoiced_amount && utility.invoiced_amount > 0 && utility.invoiced_amount < utility.amount;

  return (
    <>
      <tr className={`border-t hover:bg-slate-50 transition-colors ${!utility.selected ? 'bg-gray-50 text-gray-400' : ''}`}>
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
              {hasBeenPartiallyInvoiced && (
                <div className="text-xs text-blue-600">
                  {formatCurrency(remainingAmount, utility.currency)} remaining
                </div>
              )}
            </div>
          )}
        </td>
        <td className="p-3 text-right font-medium">
          {utility.selected ? (
            <div className="flex items-center justify-end space-x-2">
              {isEditing ? (
                <Input 
                  type="number"
                  value={editAmount}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  step="0.01"
                  min="0"
                  max={utility.amount - (utility.invoiced_amount || 0)}
                  className="w-24 text-right h-8 text-sm"
                  autoFocus
                />
              ) : (
                <span>{formatCurrency(getAdjustedUtilityAmount(utility), utility.currency)}</span>
              )}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleEdit} 
                className="h-7 w-7 text-gray-500 hover:text-blue-600"
              >
                <Edit2 size={16} />
              </Button>
            </div>
          ) : (
            '-'
          )}
        </td>
        <td className="p-3 text-right font-medium">
          {utility.invoiced_amount ? formatCurrency(utility.invoiced_amount, utility.currency) : '-'}
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

    const formattedUtilities = utilitiesData
      ?.filter(utility => {
        const isFullyInvoiced = utility.invoiced && 
                              utility.invoiced_amount != null && 
                              utility.invoiced_amount >= utility.amount;
        return !isFullyInvoiced;
      })
      .map(utility => {
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
          invoiced_amount: utility.invoiced_amount || 0,
          applied_amount: remainingAmount
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

  const handleAppliedAmountChange = (id: string, amount: number) => {
    const updatedUtilities = utilities.map(utility => {
      if (utility.id === id) {
        return { ...utility, applied_amount: amount };
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
    
    if (utility.applied_amount !== undefined) {
      return utility.applied_amount;
    }
    
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
        invoiced_amount: utility.invoiced_amount || 0,
        applied_amount: utility.applied_amount
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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <Calculator className="h-6 w-6" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800">Cost Calculator</h3>
        </div>
        
        {hasCalculated && userRole === 'landlord' && (
          <Button 
            onClick={createInvoiceFromCalculation}
            className="bg-green-600 hover:bg-green-700 shadow-sm"
          >
            <FileText className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        )}
      </div>
      
      <p className="text-slate-600">
        Calculate rent and utilities costs for a specific property and date range
      </p>
      
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <Building className="h-5 w-5 text-blue-500" />
            Property Details
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="col-span-1 md:col-span-2">
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Property</label>
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
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Currency</label>
                <Select value={grandTotalCurrency} onValueChange={setGrandTotalCurrency} disabled={!selectedPropertyId}>
                  <SelectTrigger className="w-full">
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
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block flex items-center gap-2">
                <CalendarRange className="h-4 w-4 text-blue-500" />
                Date Range
              </label>
              <DatePickerWithRange
                date={selectedDateRange}
                onDateChange={setSelectedDateRange}
              />
              <p className="text-xs text-slate-500 mt-1">
                Select the period for which you want to calculate costs
              </p>
            </div>
            
            <div className="pt-2">
              <Button 
                onClick={calculateCosts} 
                disabled={!selectedPropertyId || !selectedDateRange?.from || !selectedDateRange?.to}
                className="w-full sm:w-auto"
                size="lg"
              >
                <Calculator className="mr-2 h-4 w-4" />
                Calculate Costs
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {hasCalculated && (
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-semibold text-center">
                Cost Summary for {format(selectedDateRange?.from || new Date(), "MMM d, yyyy")} to {format(selectedDateRange?.to || addDays(new Date(), 1), "MMM d, yyyy")}
                <p className="text-sm font-normal mt-1 text-slate-600">
                  {daysInPeriod} days period
                </p>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
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
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="h-4 w-4 text-blue-500" />
                      <p className="font-medium text-slate-700">Rent</p>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-slate-400" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <div className="p-2">
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
                  <div className="mt-2">
                    {rentAlreadyInvoiced ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Already invoiced</Badge>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-2xl font-bold text-slate-800">
                          {formatCurrency(rentAmount, rentCurrency)}
                        </p>
                        {applyVat && (
                          <div className="flex items-center gap-1 text-sm text-slate-600">
                            <span>+</span>
                            <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                              {formatCurrency(vatAmount, rentCurrency)} VAT
                            </Badge>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <CheckSquare className="h-4 w-4 text-green-500" />
                      <p className="font-medium text-slate-700">Utilities</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    {Object.entries(totalUtilitiesByCurrency).length > 0 ? (
                      <div className="space-y-2">
                        {Object.entries(totalUtilitiesByCurrency).map(([currency, amount]) => (
                          <div key={currency} className="flex items-center justify-between">
                            <Badge variant="outline" className="text-slate-600">{currency}</Badge>
                            <p className="text-xl font-bold text-slate-800">
                              {formatCurrency(amount, currency)}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xl font-bold text-slate-800">{formatCurrency(0, rentCurrency)}</p>
                    )}
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Calculator className="h-4 w-4 text-indigo-500" />
                      <p className="font-medium text-slate-700">Total</p>
                    </div>
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="flex flex-col">
                      {!rentAlreadyInvoiced && (
                        <p className="text-lg font-semibold text-slate-700">
                          {applyVat
                            ? formatCurrency(getRentWithVat(), rentCurrency)
                            : formatCurrency(rentAmount, rentCurrency)}
                        </p>
                      )}
                      
                      {Object.entries(totalUtilitiesByCurrency).map(([currency, amount]) => (
                        <div key={currency} className="mt-1">
                          {currency === rentCurrency ? (
                            <div className="flex items-center gap-1">
                              <span className="text-sm text-slate-500">+</span>
                              <p className="text-lg font-semibold text-slate-700">
                                {formatCurrency(amount, currency)}
                              </p>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <span className="text-sm text-slate-500">+</span>
                              <p className="text-lg font-semibold text-slate-700">
                                {formatCurrency(amount, currency)}
                              </p>
                              <Badge variant="outline" className="ml-1 text-xs">different currency</Badge>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <Separator className="my-2" />
                    
                    <div className="flex items-center justify-between pt-1">
                      <p className="font-medium text-slate-700">Grand Total:</p>
                      <p className="text-xl font-bold text-blue-700">
                        {formatCurrency(calculateGrandTotal(), grandTotalCurrency)}
                      </p>
                    </div>
                    <p className="text-xs text-slate-500 text-right">
                      Converted using exchange rates from BNR
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {utilities.length > 0 && (
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <CheckSquare className="h-5 w-5 text-green-500" />
                  Utility Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left p-3 text-slate-600 text-sm font-medium">TYPE</th>
                        <th className="text-left p-3 text-slate-600 text-sm font-medium">INVOICE #</th>
                        <th className="text-left p-3 text-slate-600 text-sm font-medium">ISSUED DATE</th>
                        <th className="text-left p-3 text-slate-600 text-sm font-medium">DUE DATE</th>
                        <th className="text-center p-3 text-slate-600 text-sm font-medium">INCLUDED</th>
                        <th className="text-right p-3 text-slate-600 text-sm font-medium">ORIGINAL AMOUNT</th>
                        <th className="text-right p-3 text-slate-600 text-sm font-medium">APPLIED AMOUNT</th>
                        <th className="text-right p-3 text-slate-600 text-sm font-medium">INVOICED AMOUNT</th>
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
                          onAppliedAmountChange={handleAppliedAmountChange}
                        />
                      ))}
                      {Object.entries(totalUtilitiesByCurrency).map(([currency, amount]) => (
                        <tr key={currency} className="border-t font-bold bg-slate-50">
                          <td colSpan={5} className="p-3 text-right text-slate-700">
                            Total Utilities ({currency}):
                          </td>
                          <td colSpan={2} className="p-3 text-right text-slate-800">{formatCurrency(amount, currency)}</td>
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
              .filter(utility => utility.selected)
              .map(utility => ({
                id: utility.id,
                type: utility.type,
                amount: getAdjustedUtilityAmount(utility),
                original_amount: utility.amount,
                currency: utility.currency,
                due_date: utility.due_date,
                invoiced_amount: utility.invoiced_amount || 0,
                applied_amount: utility.applied_amount
              }))
          }}
        />
      )}
    </div>
  );
};

export default CostCalculator;
