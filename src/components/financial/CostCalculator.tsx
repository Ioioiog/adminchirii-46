
import { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/use-user-role";
import { useCurrency } from "@/hooks/useCurrency";
import { supabase } from "@/integrations/supabase/client";
import { endOfMonth, startOfMonth, format } from "date-fns";
import { useProperties } from "@/hooks/useProperties";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CalculationResult {
  rentTotal: number;
  utilitiesTotal: number;
  grandTotal: number;
  period: string;
  utilities: UtilityDetail[];
  rentDetails: RentDetail | null;
}

interface RentDetail {
  property_name: string;
  monthly_amount: number;
  currency: string;
  days_calculated: number;
  daily_rate: number;
}

interface UtilityDetail {
  id: string;
  type: string;
  amount: number;
  invoice_number: string | null;
  due_date: string;
  issued_date: string | null;
  currency: string;
}

export function CostCalculator() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [results, setResults] = useState<CalculationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { userRole, userId } = useUserRole();
  const { formatAmount } = useCurrency();
  const { properties } = useProperties({ userRole: userRole || 'tenant' });
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (properties.length > 0 && !selectedPropertyId) {
      setSelectedPropertyId(properties[0].id);
    }
  }, [properties, selectedPropertyId]);

  const calculateCosts = async () => {
    if (!dateRange?.from || !dateRange?.to || !userId) return;

    setIsLoading(true);
    try {
      const startDate = format(dateRange.from, 'yyyy-MM-dd');
      const endDate = format(dateRange.to, 'yyyy-MM-dd');
      const displayPeriod = `${format(dateRange.from, 'PP')} to ${format(dateRange.to, 'PP')}`;

      let queryParams: any = {}; 
      
      if (selectedPropertyId) {
        queryParams.property_id = selectedPropertyId;
      }

      let rentTotal = 0;
      let rentDetails: RentDetail | null = null;
      let selectedPropertyName = '';
      
      // Get the property name
      const selectedProperty = properties.find(p => p.id === selectedPropertyId);
      if (selectedProperty) {
        selectedPropertyName = selectedProperty.name;
      }
      
      if (userRole === 'tenant') {
        const { data: tenancy } = await supabase
          .from('tenancies')
          .select(`
            property_id,
            properties:properties (
              monthly_rent,
              name
            )
          `)
          .eq('tenant_id', userId)
          .eq('status', 'active')
          .eq('property_id', selectedPropertyId)
          .maybeSingle();

        if (tenancy?.properties?.monthly_rent) {
          const days = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          const monthlyRent = tenancy.properties.monthly_rent;
          const dailyRate = monthlyRent / 30;
          rentTotal = days <= 31 ? dailyRate * days : monthlyRent;
          
          rentDetails = {
            property_name: tenancy.properties.name || selectedPropertyName,
            monthly_amount: monthlyRent,
            currency: 'EUR',
            days_calculated: days,
            daily_rate: dailyRate
          };
        }
      } else if (userRole === 'landlord') {
        const { data: properties } = await supabase
          .from('properties')
          .select(`
            id,
            name,
            monthly_rent,
            tenancies:tenancies (
              id,
              status
            )
          `)
          .eq('landlord_id', userId)
          .eq(selectedPropertyId ? 'id' : 'id', selectedPropertyId || undefined);

        if (properties && properties.length > 0) {
          for (const property of properties) {
            const activeTenancies = property.tenancies.filter((t: any) => t.status === 'active');
            if (activeTenancies.length > 0) {
              const days = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
              const monthlyRent = property.monthly_rent;
              const dailyRate = monthlyRent / 30;
              rentTotal += days <= 31 ? dailyRate * days : monthlyRent;
              
              // Just use the first property for rent details if there are multiple
              if (!rentDetails) {
                rentDetails = {
                  property_name: property.name || selectedPropertyName,
                  monthly_amount: monthlyRent,
                  currency: 'EUR',
                  days_calculated: days,
                  daily_rate: dailyRate
                };
              }
            }
          }
        }
      }

      const { data: utilities = [] } = await supabase
        .from('utilities')
        .select('id, type, amount, due_date, currency, invoice_number, issued_date')
        .gte('issued_date', startDate)
        .lte('issued_date', endDate)
        .eq('property_id', selectedPropertyId);

      const utilitiesTotal = utilities.reduce((sum, item) => sum + (parseFloat(item.amount.toString()) || 0), 0);

      // For grand total, we need to convert currencies properly
      // Get exchange rates
      const { data: exchangeRatesData } = await supabase.functions.invoke('get-exchange-rates');
      const rates = exchangeRatesData?.rates || { EUR: 4.97, RON: 1 }; // Fallback rates
      
      // Convert rent from EUR to RON for proper summing
      const rentInRON = rentTotal * rates.EUR;
      const grandTotal = rentInRON + utilitiesTotal;

      setResults({
        rentTotal,
        utilitiesTotal,
        grandTotal,
        period: displayPeriod,
        utilities: utilities,
        rentDetails: rentDetails
      });

    } catch (error) {
      console.error("Error calculating costs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Cost Calculator
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Select a property and date range to calculate your total expenses (rent + utilities)
            </p>
            <div className="flex flex-col gap-4">
              <div className="w-full">
                <Select
                  value={selectedPropertyId}
                  onValueChange={(value) => setSelectedPropertyId(value)}
                  disabled={properties.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name}
                      </SelectItem>
                    ))}
                    {properties.length === 0 && (
                      <SelectItem value="no-property" disabled>
                        No properties available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                <div className="w-full sm:w-auto">
                  <DatePickerWithRange date={dateRange} setDate={setDateRange} />
                </div>
                <Button 
                  onClick={calculateCosts} 
                  disabled={isLoading || !dateRange?.from || !dateRange?.to || !selectedPropertyId}
                >
                  {isLoading ? "Calculating..." : "Calculate"}
                </Button>
              </div>
            </div>
          </div>

          {results && (
            <div className="mt-4 space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-md">
                <h3 className="font-medium">Cost Summary for {results.period}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Rent</p>
                    <p className="text-lg font-medium">{formatAmount(results.rentTotal, 'EUR')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Utilities</p>
                    <p className="text-lg font-medium">{formatAmount(results.utilitiesTotal, 'RON')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-xl font-bold text-blue-600">
                      {formatAmount(results.utilitiesTotal, 'RON')}
                      <br />
                      <span className="text-sm font-normal text-gray-500">
                        + rent ({formatAmount(results.rentTotal, 'EUR')})
                      </span>
                      <br />
                      <span className="text-lg font-semibold text-blue-700">
                        = {formatAmount(results.grandTotal, 'RON')}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Add Rent Details Section */}
              {results.rentDetails && (
                <div className="p-4 border rounded-md">
                  <h3 className="font-medium mb-3">Rent Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Property</p>
                      <p className="font-medium">{results.rentDetails.property_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Monthly Rent</p>
                      <p className="font-medium">{formatAmount(results.rentDetails.monthly_amount, 'EUR')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Days Calculated</p>
                      <p className="font-medium">{results.rentDetails.days_calculated} days</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Daily Rate</p>
                      <p className="font-medium">{formatAmount(results.rentDetails.daily_rate, 'EUR')}/day</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-500">Total Rent (for selected period)</p>
                      <p className="font-bold text-blue-600">{formatAmount(results.rentTotal, 'EUR')}</p>
                    </div>
                  </div>
                </div>
              )}

              {results.utilities.length > 0 && (
                <div className="p-4 border rounded-md">
                  <h3 className="font-medium mb-3">Utility Details</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Invoice #</th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Issued Date</th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Due Date</th>
                          <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {results.utilities.map((utility) => (
                          <tr key={utility.id}>
                            <td className="px-3 py-2 whitespace-nowrap text-sm capitalize">{utility.type}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm">{utility.invoice_number || 'N/A'}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm">
                              {utility.issued_date ? new Date(utility.issued_date).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm">{new Date(utility.due_date).toLocaleDateString()}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-right font-medium">
                              {formatAmount(utility.amount, utility.currency || 'RON')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <td colSpan={4} className="px-3 py-2 text-sm font-medium text-right">Total Utilities:</td>
                          <td className="px-3 py-2 text-sm font-bold text-right">{formatAmount(results.utilitiesTotal, 'RON')}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
