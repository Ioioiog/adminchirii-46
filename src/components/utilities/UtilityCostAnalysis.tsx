
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/hooks/useCurrency";
import { startOfMonth, endOfMonth, format, subMonths } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UtilityCostAnalysisProps {
  propertyId: string;
}

interface UtilityData {
  month: string;
  electricity: number;
  water: number;
  gas: number;
  internet: number;
  building_maintenance: number;
  total: number;
}

type PeriodOption = "last_month" | "last_3_months" | "last_6_months" | "last_12_months";

export function UtilityCostAnalysis({ propertyId }: UtilityCostAnalysisProps) {
  const [utilityData, setUtilityData] = useState<UtilityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { formatAmount } = useCurrency();
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>("last_6_months");

  useEffect(() => {
    async function fetchUtilityData() {
      setIsLoading(true);
      setError(null);
      
      try {
        // Determine how many months to fetch based on the selected period
        let monthsToFetch = 6; // default
        
        switch (selectedPeriod) {
          case "last_month":
            monthsToFetch = 1;
            break;
          case "last_3_months":
            monthsToFetch = 3;
            break;
          case "last_6_months":
            monthsToFetch = 6;
            break;
          case "last_12_months":
            monthsToFetch = 12;
            break;
        }
        
        // Get data for the selected period
        const lastMonths = Array.from({ length: monthsToFetch }, (_, i) => {
          const date = subMonths(new Date(), i);
          return {
            startDate: format(startOfMonth(date), 'yyyy-MM-dd'),
            endDate: format(endOfMonth(date), 'yyyy-MM-dd'),
            month: format(date, 'MMM yyyy')
          };
        });

        const monthlyData: UtilityData[] = [];
        
        for (const { startDate, endDate, month } of lastMonths) {
          // Fetch utilities for this month
          const { data: utilities, error } = await supabase
            .from('utilities')
            .select('type, amount')
            .eq('property_id', propertyId)
            .gte('issued_date', startDate)
            .lte('issued_date', endDate);

          if (error) throw error;

          // Initialize monthly data
          const monthData: UtilityData = {
            month,
            electricity: 0,
            water: 0,
            gas: 0,
            internet: 0,
            building_maintenance: 0,
            total: 0
          };

          // Sum up utilities by type
          utilities?.forEach(utility => {
            const amount = Number(utility.amount);
            if (utility.type === 'electricity') monthData.electricity += amount;
            if (utility.type === 'water') monthData.water += amount;
            if (utility.type === 'gas') monthData.gas += amount;
            if (utility.type === 'internet') monthData.internet += amount;
            if (utility.type === 'building maintenance') monthData.building_maintenance += amount;
            monthData.total += amount;
          });

          monthlyData.push(monthData);
        }

        // Sort data with newest months first
        setUtilityData(monthlyData.reverse());
      } catch (err: any) {
        console.error("Error fetching utility data:", err);
        setError("Failed to load utility data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }

    if (propertyId) {
      fetchUtilityData();
    }
  }, [propertyId, selectedPeriod]);

  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Monthly Utility Costs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Monthly Utility Costs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-red-50 text-red-800 rounded-md">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate averages
  const averages = {
    electricity: utilityData.reduce((sum, month) => sum + month.electricity, 0) / utilityData.length || 0,
    water: utilityData.reduce((sum, month) => sum + month.water, 0) / utilityData.length || 0,
    gas: utilityData.reduce((sum, month) => sum + month.gas, 0) / utilityData.length || 0,
    internet: utilityData.reduce((sum, month) => sum + month.internet, 0) / utilityData.length || 0,
    building_maintenance: utilityData.reduce((sum, month) => sum + month.building_maintenance, 0) / utilityData.length || 0,
    total: utilityData.reduce((sum, month) => sum + month.total, 0) / utilityData.length || 0
  };

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <CardTitle>Monthly Utility Costs</CardTitle>
        <div className="mt-2 sm:mt-0">
          <Select 
            value={selectedPeriod} 
            onValueChange={(value) => setSelectedPeriod(value as PeriodOption)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_month">Last Month</SelectItem>
              <SelectItem value="last_3_months">Last 3 Months</SelectItem>
              <SelectItem value="last_6_months">Last 6 Months</SelectItem>
              <SelectItem value="last_12_months">Last 12 Months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {utilityData.length === 0 ? (
          <div className="p-4 bg-gray-50 text-gray-600 rounded-md text-center">
            No utility data available for this property.
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">Monthly Average Costs</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                <div className="p-3 bg-blue-50 rounded-md">
                  <div className="text-sm text-gray-500">Electricity</div>
                  <div className="font-medium">{formatAmount(averages.electricity, 'RON')}</div>
                </div>
                <div className="p-3 bg-blue-50 rounded-md">
                  <div className="text-sm text-gray-500">Water</div>
                  <div className="font-medium">{formatAmount(averages.water, 'RON')}</div>
                </div>
                <div className="p-3 bg-blue-50 rounded-md">
                  <div className="text-sm text-gray-500">Gas</div>
                  <div className="font-medium">{formatAmount(averages.gas, 'RON')}</div>
                </div>
                <div className="p-3 bg-blue-50 rounded-md">
                  <div className="text-sm text-gray-500">Internet</div>
                  <div className="font-medium">{formatAmount(averages.internet, 'RON')}</div>
                </div>
                <div className="p-3 bg-blue-50 rounded-md">
                  <div className="text-sm text-gray-500">Building</div>
                  <div className="font-medium">{formatAmount(averages.building_maintenance, 'RON')}</div>
                </div>
                <div className="p-3 bg-indigo-100 rounded-md">
                  <div className="text-sm text-gray-700">Total Monthly</div>
                  <div className="font-bold">{formatAmount(averages.total, 'RON')}</div>
                </div>
              </div>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={utilityData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatAmount(Number(value), 'RON')} />
                  <Legend />
                  <Bar dataKey="electricity" name="Electricity" fill="#3b82f6" />
                  <Bar dataKey="water" name="Water" fill="#06b6d4" />
                  <Bar dataKey="gas" name="Gas" fill="#f59e0b" />
                  <Bar dataKey="internet" name="Internet" fill="#8b5cf6" />
                  <Bar dataKey="building_maintenance" name="Building" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-medium mb-3">Monthly Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left">Month</th>
                      <th className="px-4 py-2 text-right">Electricity</th>
                      <th className="px-4 py-2 text-right">Water</th>
                      <th className="px-4 py-2 text-right">Gas</th>
                      <th className="px-4 py-2 text-right">Internet</th>
                      <th className="px-4 py-2 text-right">Building</th>
                      <th className="px-4 py-2 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {utilityData.map((month, index) => (
                      <tr key={index} className="border-b border-gray-200">
                        <td className="px-4 py-2">{month.month}</td>
                        <td className="px-4 py-2 text-right">{formatAmount(month.electricity, 'RON')}</td>
                        <td className="px-4 py-2 text-right">{formatAmount(month.water, 'RON')}</td>
                        <td className="px-4 py-2 text-right">{formatAmount(month.gas, 'RON')}</td>
                        <td className="px-4 py-2 text-right">{formatAmount(month.internet, 'RON')}</td>
                        <td className="px-4 py-2 text-right">{formatAmount(month.building_maintenance, 'RON')}</td>
                        <td className="px-4 py-2 text-right font-medium">{formatAmount(month.total, 'RON')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
