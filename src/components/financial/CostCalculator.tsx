
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

interface CalculationResult {
  rentTotal: number;
  utilitiesTotal: number;
  grandTotal: number;
  period: string;
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

  const calculateCosts = async () => {
    if (!dateRange?.from || !dateRange?.to || !userId) return;

    setIsLoading(true);
    try {
      // Format dates for display
      const startDate = format(dateRange.from, 'yyyy-MM-dd');
      const endDate = format(dateRange.to, 'yyyy-MM-dd');
      const displayPeriod = `${format(dateRange.from, 'PP')} to ${format(dateRange.to, 'PP')}`;

      // Query parameters based on user role
      const queryParams = userRole === 'landlord' 
        ? { landlord_id: userId }
        : { tenant_id: userId };

      // Get rent information from properties and tenancies
      let rentTotal = 0;
      if (userRole === 'tenant') {
        // For tenants, get their active tenancy and property
        const { data: tenancy } = await supabase
          .from('tenancies')
          .select(`
            property_id,
            properties:properties (
              monthly_rent
            )
          `)
          .eq('tenant_id', userId)
          .eq('status', 'active')
          .maybeSingle();

        if (tenancy?.properties?.monthly_rent) {
          // Calculate prorated amount if date range is less than a month
          const days = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          const monthlyRent = tenancy.properties.monthly_rent;
          rentTotal = days <= 31 ? (monthlyRent / 30) * days : monthlyRent;
        }
      } else if (userRole === 'landlord') {
        // For landlords, sum up all active tenancies' rents
        const { data: properties } = await supabase
          .from('properties')
          .select(`
            id,
            monthly_rent,
            tenancies:tenancies (
              id,
              status
            )
          `)
          .eq('landlord_id', userId);

        if (properties) {
          for (const property of properties) {
            const activeTenancies = property.tenancies.filter((t: any) => t.status === 'active');
            if (activeTenancies.length > 0) {
              // Calculate prorated amount if date range is less than a month
              const days = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
              const monthlyRent = property.monthly_rent;
              rentTotal += days <= 31 ? (monthlyRent / 30) * days : monthlyRent;
            }
          }
        }
      }

      // Get utilities for the date range
      const { data: utilities } = await supabase
        .from('utilities')
        .select('amount')
        .gte('due_date', startDate)
        .lte('due_date', endDate)
        .match(queryParams);

      const utilitiesTotal = utilities?.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0) || 0;

      // Set the results
      setResults({
        rentTotal,
        utilitiesTotal,
        grandTotal: rentTotal + utilitiesTotal,
        period: displayPeriod
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
              Select a date range to calculate your total expenses (rent + utilities)
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
              <div className="w-full sm:w-auto">
                <DatePickerWithRange date={dateRange} setDate={setDateRange} />
              </div>
              <Button onClick={calculateCosts} disabled={isLoading || !dateRange?.from || !dateRange?.to}>
                {isLoading ? "Calculating..." : "Calculate"}
              </Button>
            </div>
          </div>

          {results && (
            <div className="mt-4 space-y-2 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-md">
              <h3 className="font-medium">Cost Summary for {results.period}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                <div>
                  <p className="text-sm text-muted-foreground">Rent</p>
                  <p className="text-lg font-medium">{formatAmount(results.rentTotal)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Utilities</p>
                  <p className="text-lg font-medium">{formatAmount(results.utilitiesTotal)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-xl font-bold text-blue-600">{formatAmount(results.grandTotal)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
