import { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/use-user-role";
import { useCurrency } from "@/hooks/useCurrency";
import { supabase } from "@/integrations/supabase/client";
import { 
  endOfMonth, 
  startOfMonth, 
  format, 
  isSameMonth, 
  differenceInDays, 
  isLastDayOfMonth,
  subMonths 
} from "date-fns";
import { useProperties } from "@/hooks/useProperties";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProfileInvoiceInfo, InvoiceSettings } from "@/types/invoice";
import { UTILITY_TYPES } from "@/components/utilities/providers/types";

interface UtilityCost {
  date: string;
  utility_type: string;
  amount: number;
}

interface ChartData {
  month: string;
  electricity: number;
  water: number;
  gas: number;
  internet: number;
  building_maintenance: number;
  other: number;
  trash: number;
  heating: number;
  cooling: number;
  sewage: number;
  security: number;
  landscaping: number;
  cleaning: number;
  total: number;
}

interface CalculationResult {
  rentTotal: number;
  rentVatRate: number | null;
  rentVatAmount: number;
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
  is_full_month: boolean;
  vat_rate: number | null;
  vat_amount: number;
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
      let rentVatRate: number | null = null;
      let rentVatAmount = 0;
      let rentDetails: RentDetail | null = null;
      let selectedPropertyName = '';
      
      const selectedProperty = properties.find(p => p.id === selectedPropertyId);
      if (selectedProperty) {
        selectedPropertyName = selectedProperty.name;
      }
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('invoice_info')
        .eq('id', userId)
        .single();
      
      let applyVat = false;
      let vatRate = 19; // Default VAT rate (percent)
      
      if (profileData?.invoice_info) {
        const invoiceInfo = profileData.invoice_info as unknown as InvoiceSettings;
        applyVat = !!invoiceInfo?.apply_vat;
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
          const days = differenceInDays(dateRange.to, dateRange.from) + 1;
          const monthlyRent = tenancy.properties.monthly_rent;
          const dailyRate = monthlyRent / 30;
          
          const isFullMonth = (
            (dateRange.from.getDate() === dateRange.to.getDate() && 
             !isSameMonth(dateRange.from, dateRange.to) && 
             days >= 28) || 
            (dateRange.from.getDate() === 1 && 
             isLastDayOfMonth(dateRange.to))
          );
          
          rentTotal = isFullMonth ? monthlyRent : dailyRate * days;
          
          if (applyVat) {
            rentVatRate = vatRate;
            rentVatAmount = (rentTotal * vatRate) / 100;
          }
          
          rentDetails = {
            property_name: tenancy.properties.name || selectedPropertyName,
            monthly_amount: monthlyRent,
            currency: 'EUR',
            days_calculated: days,
            daily_rate: dailyRate,
            is_full_month: isFullMonth,
            vat_rate: rentVatRate,
            vat_amount: rentVatAmount
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
              const days = differenceInDays(dateRange.to, dateRange.from) + 1;
              const monthlyRent = property.monthly_rent;
              const dailyRate = monthlyRent / 30;
              
              const isFullMonth = (
                (dateRange.from.getDate() === dateRange.to.getDate() && 
                 !isSameMonth(dateRange.from, dateRange.to) && 
                 days >= 28) || 
                (dateRange.from.getDate() === 1 && 
                 isLastDayOfMonth(dateRange.to))
              );
              
              const propertyRent = isFullMonth ? monthlyRent : dailyRate * days;
              rentTotal += propertyRent;
              
              if (applyVat) {
                rentVatRate = vatRate;
                const propertyVatAmount = (propertyRent * vatRate) / 100;
                rentVatAmount += propertyVatAmount;
              }
              
              if (!rentDetails) {
                rentDetails = {
                  property_name: property.name || selectedPropertyName,
                  monthly_amount: monthlyRent,
                  currency: 'EUR',
                  days_calculated: days,
                  daily_rate: dailyRate,
                  is_full_month: isFullMonth,
                  vat_rate: rentVatRate,
                  vat_amount: rentVatAmount
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

      console.log('Utilities fetched for period:', startDate, 'to', endDate);
      console.log('Property ID:', selectedPropertyId);
      console.log('Utilities data:', utilities);
      console.log('Utility types found:', utilities.map(u => u.type));
      
      const internetUtilities = utilities.filter(u => 
        u.type.toLowerCase() === 'internet' || 
        u.type.toLowerCase().includes('internet') ||
        u.type.toLowerCase().includes('digi')
      );
      console.log('Internet utilities:', internetUtilities);

      const utilitiesTotal = utilities.reduce((sum, item) => sum + (parseFloat(item.amount.toString()) || 0), 0);

      const { data: exchangeRatesData } = await supabase.functions.invoke('get-exchange-rates');
      const rates = exchangeRatesData?.rates || { EUR: 4.97, RON: 1 };

      const rentInRON = rentTotal * rates.EUR;
      const vatInRON = rentVatAmount * rates.EUR;
      const grandTotal = rentInRON + vatInRON + utilitiesTotal;

      setResults({
        rentTotal,
        rentVatRate,
        rentVatAmount,
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

  const processUtilityData = (data: UtilityCost[], range: "6months" | "12months" | "all"): ChartData[] => {
    let filteredData = [...data];
    const now = new Date();
    
    if (range === "6months") {
      const sixMonthsAgo = subMonths(now, 6);
      filteredData = data.filter(item => new Date(item.date) >= sixMonthsAgo);
    } else if (range === "12months") {
      const twelveMonthsAgo = subMonths(now, 12);
      filteredData = data.filter(item => new Date(item.date) >= twelveMonthsAgo);
    }

    console.log('Processing utility data:', filteredData);

    const monthlyData: Record<string, Record<string, number>> = {};

    filteredData.forEach(item => {
      const date = new Date(item.date);
      const monthYear = format(date, 'MMM yyyy');
      
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = {
          electricity: 0,
          water: 0,
          gas: 0,
          internet: 0,
          building_maintenance: 0,
          trash: 0,
          heating: 0,
          cooling: 0,
          sewage: 0,
          security: 0,
          landscaping: 0,
          cleaning: 0,
          other: 0,
          total: 0
        };
      }
      
      let utilityType = item.utility_type.replace(/ /g, '_').toLowerCase();
      
      console.log('Processing item:', { 
        date: item.date,
        original_type: item.utility_type,
        normalized_type: utilityType,
        amount: item.amount
      });
      
      if (monthlyData[monthYear][utilityType] !== undefined) {
        monthlyData[monthYear][utilityType] += item.amount;
        monthlyData[monthYear].total += item.amount;
        console.log(`Added ${item.amount} to ${utilityType}, new total: ${monthlyData[monthYear][utilityType]}`);
      } else {
        console.log(`Unmapped utility type: ${utilityType}, adding to "other"`);
        monthlyData[monthYear].other += item.amount;
        monthlyData[monthYear].total += item.amount;
      }
    });

    console.log('Monthly data processed:', monthlyData);

    const chartData: ChartData[] = Object.keys(monthlyData).map(month => ({
      month,
      electricity: monthlyData[month].electricity || 0,
      water: monthlyData[month].water || 0,
      gas: monthlyData[month].gas || 0,
      internet: monthlyData[month].internet || 0,
      building_maintenance: monthlyData[month].building_maintenance || 0,
      trash: monthlyData[month].trash || 0,
      heating: monthlyData[month].heating || 0,
      cooling: monthlyData[month].cooling || 0,
      sewage: monthlyData[month].sewage || 0,
      security: monthlyData[month].security || 0,
      landscaping: monthlyData[month].landscaping || 0,
      cleaning: monthlyData[month].cleaning || 0,
      other: monthlyData[month].other || 0,
      total: monthlyData[month].total || 0
    }));

    chartData.sort((a, b) => {
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateA.getTime() - dateB.getTime();
    });

    console.log('Final chart data:', chartData);

    return chartData;
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
                    {results.rentVatRate && (
                      <p className="text-sm text-muted-foreground">
                        + VAT {results.rentVatRate}%: {formatAmount(results.rentVatAmount, 'EUR')}
                      </p>
                    )}
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
                        {results.rentVatAmount > 0 && ` + VAT (${formatAmount(results.rentVatAmount, 'EUR')})`}
                      </span>
                      <br />
                      <span className="text-lg font-semibold text-blue-700">
                        = {formatAmount(results.grandTotal, 'RON')}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

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
                      <p className="text-sm text-gray-500">Calculation Type</p>
                      <p className="font-medium">
                        {results.rentDetails.is_full_month 
                          ? "Full Month" 
                          : `${results.rentDetails.days_calculated} days (partial month)`}
                      </p>
                    </div>
                    {!results.rentDetails.is_full_month && (
                      <div>
                        <p className="text-sm text-gray-500">Daily Rate</p>
                        <p className="font-medium">{formatAmount(results.rentDetails.daily_rate, 'EUR')}/day</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-500">Total Rent (for selected period)</p>
                      <p className="font-bold text-blue-600">{formatAmount(results.rentTotal, 'EUR')}</p>
                    </div>
                    {results.rentDetails.vat_rate && (
                      <div>
                        <p className="text-sm text-gray-500">VAT ({results.rentDetails.vat_rate}%)</p>
                        <p className="font-medium text-blue-600">{formatAmount(results.rentDetails.vat_amount, 'EUR')}</p>
                      </div>
                    )}
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
