
import React, { useState, useEffect } from 'react';
import { DateRange } from 'react-day-picker';
import { format, addDays, differenceInDays, isSameDay, addMonths } from 'date-fns';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Calculator, DollarSign, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useProperties } from '@/hooks/useProperties';
import { useUserRole } from '@/hooks/use-user-role';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface UtilityItem {
  type: string;
  invoice_number: string;
  issued_date: string;
  due_date: string;
  amount: number;
  currency: string;
}

const CostCalculator = () => {
  const { userRole } = useUserRole();
  const { properties } = useProperties({ userRole: userRole || 'tenant' });
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

  useEffect(() => {
    if (selectedPropertyId) {
      const property = properties.find(p => p.id === selectedPropertyId);
      setSelectedProperty(property);
      if (property) {
        setRentCurrency(property.currency || 'RON');
      }
    }
  }, [selectedPropertyId, properties]);

  useEffect(() => {
    if (selectedDateRange?.from && selectedDateRange?.to) {
      const days = differenceInDays(selectedDateRange.to, selectedDateRange.from) + 1;
      setDaysInPeriod(days);
      
      // Check if it's a full month (e.g., from the 2nd of one month to the 2nd of the next month)
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

    // Calculate rent for the period
    const days = daysInPeriod;
    const monthlyRent = selectedProperty?.monthly_rent || 0;
    
    let periodRent;
    if (rentCalculationType === 'full') {
      // If it's a full month, use the monthly rent directly
      periodRent = monthlyRent;
    } else {
      // Calculate daily rent based on 30 days per month
      const dailyRent = monthlyRent / 30;
      periodRent = dailyRent * days;
    }
    
    setRentAmount(Math.round(periodRent * 100) / 100);

    // Fetch utilities for the selected property and date range
    const { data: utilitiesData, error } = await supabase
      .from('utilities')
      .select('*')
      .eq('property_id', selectedPropertyId)
      .gte('due_date', selectedDateRange.from.toISOString())
      .lte('due_date', selectedDateRange.to.toISOString());

    if (error) {
      console.error('Error fetching utilities:', error);
      return;
    }

    // Format utilities data
    const formattedUtilities = utilitiesData?.map(utility => ({
      type: utility.type,
      invoice_number: utility.invoice_number || '-',
      issued_date: utility.issued_date ? format(new Date(utility.issued_date), 'MM/dd/yyyy') : '-',
      due_date: format(new Date(utility.due_date), 'MM/dd/yyyy'),
      amount: utility.amount,
      currency: utility.currency || rentCurrency // Use the utility's currency or default to property currency
    })) || [];

    // Group utilities by currency and calculate totals
    const utilitiesByCurrency: Record<string, number> = {};
    formattedUtilities.forEach(utility => {
      const currency = utility.currency;
      if (!utilitiesByCurrency[currency]) {
        utilitiesByCurrency[currency] = 0;
      }
      utilitiesByCurrency[currency] += utility.amount;
    });

    // Round values for display
    Object.keys(utilitiesByCurrency).forEach(currency => {
      utilitiesByCurrency[currency] = Math.round(utilitiesByCurrency[currency] * 100) / 100;
    });

    setTotalUtilitiesByCurrency(utilitiesByCurrency);
    setUtilities(formattedUtilities);
    setHasCalculated(true);
  };

  // Format currency for display
  const formatCurrency = (amount: number, currency: string) => {
    return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-xl font-bold">{formatCurrency(rentAmount, rentCurrency)}</p>
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
                      <p key={currency} className="text-xl font-bold">{formatCurrency(amount, currency)}</p>
                    ))}
                    {Object.keys(totalUtilitiesByCurrency).length === 0 && (
                      <p className="text-xl font-bold">{formatCurrency(0, rentCurrency)}</p>
                    )}
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-gray-600">Total</p>
                  <div>
                    <p className="text-xl font-bold text-blue-600">{formatCurrency(rentAmount, rentCurrency)}</p>
                    {Object.entries(totalUtilitiesByCurrency).map(([currency, amount]) => (
                      <React.Fragment key={currency}>
                        {currency === rentCurrency ? (
                          <p className="text-lg font-bold text-blue-600">
                            = {formatCurrency(rentAmount + amount, currency)}
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
            </CardContent>
          </Card>
          
          {utilities.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h4 className="text-xl font-semibold mb-4">Utility Details</h4>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left p-3 text-gray-600">TYPE</th>
                        <th className="text-left p-3 text-gray-600">INVOICE #</th>
                        <th className="text-left p-3 text-gray-600">ISSUED DATE</th>
                        <th className="text-left p-3 text-gray-600">DUE DATE</th>
                        <th className="text-right p-3 text-gray-600">AMOUNT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {utilities.map((utility, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-3">{utility.type}</td>
                          <td className="p-3">{utility.invoice_number}</td>
                          <td className="p-3">{utility.issued_date}</td>
                          <td className="p-3">{utility.due_date}</td>
                          <td className="p-3 text-right font-medium">{formatCurrency(utility.amount, utility.currency)}</td>
                        </tr>
                      ))}
                      {Object.entries(totalUtilitiesByCurrency).map(([currency, amount]) => (
                        <tr key={currency} className="border-t font-bold">
                          <td colSpan={4} className="p-3 text-right">Total Utilities ({currency}):</td>
                          <td className="p-3 text-right">{formatCurrency(amount, currency)}</td>
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
    </div>
  );
};

export default CostCalculator;
