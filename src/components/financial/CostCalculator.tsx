
import React, { useState, useEffect } from 'react';
import { DateRange } from 'react-day-picker';
import { format, addDays } from 'date-fns';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Calculator } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useProperties } from '@/hooks/useProperties';
import { useUserRole } from '@/hooks/use-user-role';

interface UtilityItem {
  type: string;
  invoice_number: string;
  issued_date: string;
  due_date: string;
  amount: number;
}

const CostCalculator = () => {
  const { userRole } = useUserRole();
  const { properties } = useProperties({ userRole: userRole || 'tenant' });
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>(undefined);
  const [rentAmount, setRentAmount] = useState<number>(0);
  const [utilities, setUtilities] = useState<UtilityItem[]>([]);
  const [hasCalculated, setHasCalculated] = useState<boolean>(false);
  const [currency, setCurrency] = useState<string>('RON');
  const [totalUtilities, setTotalUtilities] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);

  useEffect(() => {
    if (selectedPropertyId) {
      const property = properties.find(p => p.id === selectedPropertyId);
      setSelectedProperty(property);
      if (property) {
        setRentAmount(property.monthly_rent);
        setCurrency(property.currency || 'RON');
      }
    }
  }, [selectedPropertyId, properties]);

  const calculateCosts = async () => {
    if (!selectedPropertyId || !selectedDateRange?.from || !selectedDateRange?.to) {
      return;
    }

    // Calculate rent for the period
    const days = (selectedDateRange.to.getTime() - selectedDateRange.from.getTime()) / (1000 * 3600 * 24) + 1;
    const monthlyRent = selectedProperty?.monthly_rent || 0;
    const dailyRent = monthlyRent / 30;
    const periodRent = dailyRent * days;
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
      amount: utility.amount
    })) || [];

    // Calculate total utilities cost
    const utilitiesTotal = formattedUtilities.reduce((sum, utility) => sum + utility.amount, 0);
    setTotalUtilities(Math.round(utilitiesTotal * 100) / 100);
    setUtilities(formattedUtilities);
    setTotalAmount(Math.round((periodRent + utilitiesTotal) * 100) / 100);
    setHasCalculated(true);
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
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-gray-600">Rent</p>
                  <p className="text-xl font-bold">{currency} {rentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600">Utilities</p>
                  <p className="text-xl font-bold">{currency} {totalUtilities.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600">Total</p>
                  <p className="text-xl font-bold text-blue-600">{currency} {totalUtilities.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <p className="text-sm text-gray-500">+ rent ({currency} {rentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</p>
                  <p className="text-lg font-bold text-blue-600">= {currency} {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
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
                          <td className="p-3 text-right font-medium">{currency} {utility.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                      <tr className="border-t font-bold">
                        <td colSpan={4} className="p-3 text-right">Total Utilities:</td>
                        <td className="p-3 text-right">{currency} {totalUtilities.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
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
