
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { TimeRange, getMonthsForRange } from "./utils/dateUtils";
import { RevenueStats } from "./RevenueStats";
import { MonthlyRevenue } from "./types/revenue";
import { useState } from "react";
import { ChartSkeleton } from "./charts/ChartSkeleton";
import { NoDataCard } from "./charts/NoDataCard";
import { TimeRangeSelect } from "./charts/TimeRangeSelect";
import { RevenueLineChart } from "./charts/RevenueLineChart";

// Increased cache time to reduce API calls
const CACHE_TIME = 15 * 60 * 1000; // 15 minutes

async function fetchRevenueData(userId: string, timeRange: TimeRange): Promise<MonthlyRevenue[]> {
  if (!userId) {
    console.warn("No userId provided to fetchRevenueData");
    return [];
  }
  
  console.log("Fetching revenue data for landlord:", userId);
  
  const months = getMonthsForRange(timeRange);
  console.log("Fetching data for months:", months);

  // Fallback to standard query since we can't use RPC function
  // Use a single optimized query for all properties with active tenancies
  const { data: propertyRevenueData, error } = await supabase
    .from("properties")
    .select(`
      id,
      name,
      monthly_rent,
      tenancies (
        id,
        start_date,
        end_date,
        status
      )
    `)
    .eq("landlord_id", userId);

  if (error) {
    console.error("Error fetching properties data:", error);
    throw error;
  }

  if (!propertyRevenueData?.length) {
    console.log("No properties found for user");
    return [];
  }

  // Process data on the client side to reduce database load
  const monthlyRevenue = months.map(monthStart => {
    const monthDate = new Date(monthStart);
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

    let totalRevenue = 0;
    const propertyBreakdown: Record<string, { name: string; total: number; count: number }> = {};

    propertyRevenueData.forEach(property => {
      if (!property) return;
      
      const activeTenantsInMonth = property.tenancies?.filter(tenancy => {
        if (!tenancy || tenancy.status !== 'active') return false;
        
        const startDate = new Date(tenancy.start_date);
        const endDate = tenancy.end_date ? new Date(tenancy.end_date) : null;
        
        return (
          startDate <= monthEnd &&
          (!endDate || endDate >= monthDate)
        );
      });

      if (activeTenantsInMonth && activeTenantsInMonth.length > 0) {
        const propertyRevenue = property.monthly_rent || 0;
        totalRevenue += propertyRevenue;

        propertyBreakdown[property.id] = {
          name: property.name || 'Unnamed Property',
          total: propertyRevenue,
          count: activeTenantsInMonth.length
        };
      }
    });

    const totalCount = Object.values(propertyBreakdown).reduce((sum, p) => sum + p.count, 0);
    const averageRevenue = totalCount > 0 ? totalRevenue / totalCount : 0;

    return {
      month: monthStart,
      revenue: totalRevenue,
      count: totalCount,
      average: averageRevenue,
      propertyBreakdown: Object.values(propertyBreakdown)
    };
  });

  return monthlyRevenue;
}

export function RevenueChart({ userId }: { userId: string }) {
  const [timeRange, setTimeRange] = useState<TimeRange>("6M");
  
  const { data: revenueData, isLoading } = useQuery({
    queryKey: ["revenue-chart", userId, timeRange],
    queryFn: () => fetchRevenueData(userId, timeRange),
    staleTime: CACHE_TIME, // Keep data fresh for 15 minutes
    gcTime: CACHE_TIME,    // Cache data for 15 minutes
  });

  if (isLoading) {
    return <ChartSkeleton />;
  }

  if (!revenueData || revenueData.length === 0) {
    return <NoDataCard />;
  }

  const totalRevenue = revenueData.reduce((sum, month) => sum + (month?.revenue || 0), 0);
  const averageRevenue = totalRevenue / revenueData.length;
  const currentMonthRevenue = revenueData[revenueData.length - 1]?.revenue || 0;
  const previousMonthRevenue = revenueData[revenueData.length - 2]?.revenue || 0;
  const revenueChange = previousMonthRevenue === 0 ? 0 : 
    ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;

  return (
    <Card className="col-span-4 overflow-hidden bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/50">
      <CardHeader className="pb-4">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="space-y-1">
            <RevenueStats 
              totalRevenue={totalRevenue}
              averageRevenue={averageRevenue}
              revenueChange={revenueChange}
            />
          </div>
          <TimeRangeSelect value={timeRange} onValueChange={setTimeRange} />
        </div>
      </CardHeader>
      <CardContent className="h-[300px] pt-4">
        <RevenueLineChart 
          data={revenueData} 
          gradientId="revenueGradient"
        />
      </CardContent>
    </Card>
  );
}
