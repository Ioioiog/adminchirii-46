
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartTooltip } from "@/components/dashboard/charts/ChartTooltip";
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from "date-fns";

interface UtilityAnalysisProps {
  propertyId: string;
}

type UtilityType = 'electricity' | 'water' | 'gas' | 'internet' | 'building maintenance';

interface ChartData {
  name: string;
  month: string;
  electricity: number;
  water: number;
  gas: number;
  internet: number;
  building_maintenance: number;
}

export function UtilityAnalysisChart({ propertyId }: UtilityAnalysisProps) {
  const [chartData, setChartData] = useState<ChartData[]>([]);

  const { data: utilities, isLoading } = useQuery({
    queryKey: ['property-utilities', propertyId],
    queryFn: async () => {
      // Get current date
      const today = new Date();
      // Get date 12 months ago
      const twelveMonthsAgo = subMonths(today, 12);
      
      const { data, error } = await supabase
        .from('utilities')
        .select('*')
        .eq('property_id', propertyId)
        .gte('created_at', twelveMonthsAgo.toISOString())
        .lte('created_at', today.toISOString());
      
      if (error) {
        console.error('Error fetching utility data:', error);
        throw error;
      }
      
      console.log('Fetched utility data:', data);
      return data || [];
    },
    enabled: !!propertyId
  });

  useEffect(() => {
    if (!utilities || utilities.length === 0) {
      // Create empty data for the last 12 months
      const emptyData = Array.from({ length: 12 }).map((_, index) => {
        const date = subMonths(new Date(), index);
        return {
          name: format(date, 'MMM yyyy'),
          month: format(date, 'yyyy-MM'),
          electricity: 0,
          water: 0,
          gas: 0,
          internet: 0,
          building_maintenance: 0,
        };
      }).reverse();
      
      setChartData(emptyData);
      return;
    }

    // Generate months for the last 12 months
    const months: { [key: string]: ChartData } = {};
    
    for (let i = 0; i < 12; i++) {
      const date = subMonths(new Date(), i);
      const monthKey = format(date, 'yyyy-MM');
      months[monthKey] = {
        name: format(date, 'MMM yyyy'),
        month: monthKey,
        electricity: 0,
        water: 0,
        gas: 0,
        internet: 0,
        building_maintenance: 0,
      };
    }

    // Fill in the data from utilities
    utilities.forEach(utility => {
      // Parse the date from the created_at field
      const utilityDate = parseISO(utility.created_at);
      const monthKey = format(utilityDate, 'yyyy-MM');
      
      // Check if this month is in our range
      if (months[monthKey]) {
        // Convert utility type to a valid property name (replace spaces with underscores)
        const typeKey = utility.type.replace(/\s+/g, '_').toLowerCase();
        
        // Add the amount to the corresponding type
        months[monthKey][typeKey as keyof Omit<ChartData, 'name' | 'month'>] += utility.amount;
      }
    });

    // Convert the months object to an array and sort by date
    const sortedData = Object.values(months).sort((a, b) => 
      a.month.localeCompare(b.month)
    );

    setChartData(sortedData);
  }, [utilities]);

  const colors = {
    electricity: "#4f46e5", // indigo
    water: "#0ea5e9", // sky blue
    gas: "#ef4444", // red
    internet: "#84cc16", // lime
    building_maintenance: "#f59e0b", // amber
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Utility Expenses Analysis</CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Utility Expenses Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" />
              <XAxis 
                dataKey="name" 
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={{ stroke: "hsl(var(--border))" }}
              />
              <YAxis 
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(value) => `$${value}`}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={{ stroke: "hsl(var(--border))" }}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="electricity"
                name="Electricity"
                stroke={colors.electricity}
                activeDot={{ r: 8 }}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="water"
                name="Water"
                stroke={colors.water}
                activeDot={{ r: 8 }}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="gas"
                name="Gas"
                stroke={colors.gas}
                activeDot={{ r: 8 }}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="internet"
                name="Internet"
                stroke={colors.internet}
                activeDot={{ r: 8 }}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="building_maintenance"
                name="Building Maintenance"
                stroke={colors.building_maintenance}
                activeDot={{ r: 8 }}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
