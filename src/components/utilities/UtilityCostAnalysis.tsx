
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, subMonths } from "date-fns";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface UtilityCost {
  id: string;
  property_id: string;
  utility_type: string;
  amount: number;
  date: string;
  created_at: string;
}

interface ChartData {
  month: string;
  electricity?: number;
  water?: number;
  gas?: number;
  internet?: number;
  building_maintenance?: number;
  total: number;
}

interface UtilityCostAnalysisProps {
  propertyId: string;
}

export function UtilityCostAnalysis({ propertyId }: UtilityCostAnalysisProps) {
  const [utilityData, setUtilityData] = useState<UtilityCost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [timeRange, setTimeRange] = useState<"6months" | "12months" | "all">("12months");
  const [chartType, setChartType] = useState<"bar" | "line">("bar");
  const [activeView, setActiveView] = useState<"chart" | "table">("chart");

  useEffect(() => {
    const fetchUtilityData = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('utilities')
          .select('*')
          .eq('property_id', propertyId)
          .order('due_date', { ascending: true });

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        const transformedData: UtilityCost[] = (data || []).map(item => ({
          id: item.id,
          property_id: item.property_id,
          utility_type: item.type.toLowerCase(),
          amount: item.amount,
          date: item.due_date,
          created_at: item.created_at
        }));

        setUtilityData(transformedData);
      } catch (error) {
        console.error('Error fetching utility data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (propertyId) {
      fetchUtilityData();
    }
  }, [propertyId]);

  useEffect(() => {
    if (utilityData.length > 0) {
      const processedData = processUtilityData(utilityData, timeRange);
      setChartData(processedData);
    }
  }, [utilityData, timeRange]);

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
          total: 0
        };
      }
      
      const utilityType = item.utility_type.replace(' ', '_').toLowerCase();
      if (monthlyData[monthYear][utilityType] !== undefined) {
        monthlyData[monthYear][utilityType] += item.amount;
        monthlyData[monthYear].total += item.amount;
      }
    });

    const chartData: ChartData[] = Object.keys(monthlyData).map(month => ({
      month,
      electricity: monthlyData[month].electricity || 0,
      water: monthlyData[month].water || 0,
      gas: monthlyData[month].gas || 0,
      internet: monthlyData[month].internet || 0,
      building_maintenance: monthlyData[month].building_maintenance || 0,
      total: monthlyData[month].total || 0
    }));

    chartData.sort((a, b) => {
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateA.getTime() - dateB.getTime();
    });

    return chartData;
  };

  const downloadCSV = () => {
    if (chartData.length === 0) return;

    const headers = ['Month', 'Electricity', 'Water', 'Gas', 'Internet', 'Building Maintenance', 'Total'];
    const csvRows = [headers.join(',')];

    chartData.forEach(row => {
      const values = [
        row.month,
        row.electricity?.toFixed(2) || '0.00',
        row.water?.toFixed(2) || '0.00',
        row.gas?.toFixed(2) || '0.00',
        row.internet?.toFixed(2) || '0.00',
        row.building_maintenance?.toFixed(2) || '0.00',
        row.total.toFixed(2)
      ];
      csvRows.push(values.join(','));
    });

    const csvContent = csvRows.join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `utility_costs_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const calculateTotals = () => {
    if (chartData.length === 0) return { electricity: 0, water: 0, gas: 0, internet: 0, building_maintenance: 0, total: 0 };

    return chartData.reduce((acc, curr) => {
      return {
        electricity: acc.electricity + (curr.electricity || 0),
        water: acc.water + (curr.water || 0),
        gas: acc.gas + (curr.gas || 0),
        internet: acc.internet + (curr.internet || 0),
        building_maintenance: acc.building_maintenance + (curr.building_maintenance || 0),
        total: acc.total + curr.total
      };
    }, { electricity: 0, water: 0, gas: 0, internet: 0, building_maintenance: 0, total: 0 });
  };

  const formatCurrency = (value: number) => {
    return `RON ${value.toFixed(2)}`;
  };

  const totals = calculateTotals();
  const averageMonthly = chartData.length > 0 ? totals.total / chartData.length : 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (utilityData.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
        <p className="text-gray-500">No utility cost data available for this property.</p>
        <p className="text-sm text-gray-400 mt-1">
          Utility costs will appear here once they are recorded.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as any)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="12months">Last 12 Months</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          
          <Tabs defaultValue="chart" className="w-[200px]" onValueChange={(value) => setActiveView(value as "chart" | "table")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chart">Chart</TabsTrigger>
              <TabsTrigger value="table">Table</TabsTrigger>
            </TabsList>
          </Tabs>
          
          {activeView === "chart" && (
            <Select value={chartType} onValueChange={(value) => setChartType(value as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select chart type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">Bar Chart</SelectItem>
                <SelectItem value="line">Line Chart</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
        
        <Button variant="outline" size="sm" onClick={downloadCSV} className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Average Monthly</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(averageMonthly)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Electricity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.electricity)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Water</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.water)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Gas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.gas)}</div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs value={activeView} className="w-full">
        <TabsContent value="chart">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Utility Costs Over Time</CardTitle>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Info className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-2">
                    <h4 className="font-medium">About this chart</h4>
                    <p className="text-sm text-gray-500">
                      This chart shows the breakdown of utility costs over time. You can switch between
                      bar and line charts, and export the data as a CSV file.
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === "bar" ? (
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="month" 
                        scale="auto"
                        type="category" 
                        allowDuplicatedCategory={false} 
                      />
                      <YAxis 
                        scale="auto"
                        type="number" 
                        allowDecimals={true} 
                        tickFormatter={(value) => `RON ${value}`}
                      />
                      <Tooltip formatter={(value) => [`RON ${Number(value).toFixed(2)}`, undefined]} />
                      <Legend verticalAlign="top" height={36} />
                      <Bar dataKey="electricity" name="Electricity" fill="#3b82f6" />
                      <Bar dataKey="water" name="Water" fill="#06b6d4" />
                      <Bar dataKey="gas" name="Gas" fill="#f97316" />
                      <Bar dataKey="internet" name="Internet" fill="#8b5cf6" />
                      <Bar dataKey="building_maintenance" name="Building Maintenance" fill="#10b981" />
                    </BarChart>
                  ) : (
                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `RON ${value}`} />
                      <Tooltip formatter={(value) => [`RON ${Number(value).toFixed(2)}`, undefined]} />
                      <Legend verticalAlign="top" height={36} />
                      <Line type="monotone" dataKey="electricity" name="Electricity" stroke="#3b82f6" activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="water" name="Water" stroke="#06b6d4" />
                      <Line type="monotone" dataKey="gas" name="Gas" stroke="#f97316" />
                      <Line type="monotone" dataKey="internet" name="Internet" stroke="#8b5cf6" />
                      <Line type="monotone" dataKey="building_maintenance" name="Building Maintenance" stroke="#10b981" />
                      <Line type="monotone" dataKey="total" name="Total" stroke="#ef4444" strokeWidth={2} />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead>Electricity</TableHead>
                    <TableHead>Water</TableHead>
                    <TableHead>Gas</TableHead>
                    <TableHead>Internet</TableHead>
                    <TableHead>Building Maintenance</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chartData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.month}</TableCell>
                      <TableCell>{formatCurrency(row.electricity || 0)}</TableCell>
                      <TableCell>{formatCurrency(row.water || 0)}</TableCell>
                      <TableCell>{formatCurrency(row.gas || 0)}</TableCell>
                      <TableCell>{formatCurrency(row.internet || 0)}</TableCell>
                      <TableCell>{formatCurrency(row.building_maintenance || 0)}</TableCell>
                      <TableCell className="font-bold">{formatCurrency(row.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
