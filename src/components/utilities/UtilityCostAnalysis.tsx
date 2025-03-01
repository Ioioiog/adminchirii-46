
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrency } from "@/hooks/useCurrency";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface UtilityCostData {
  property_id: string;
  property_name: string;
  month: string;
  year: number;
  utility_type: string;
  total_cost: number;
}

interface UtilityCostAnalysisProps {
  userId: string;
  userRole: 'landlord' | 'tenant';
}

export function UtilityCostAnalysis({ userId, userRole }: UtilityCostAnalysisProps) {
  const [costData, setCostData] = useState<UtilityCostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<{id: string, name: string}[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const { formatAmount } = useCurrency();

  useEffect(() => {
    fetchProperties();
  }, [userId, userRole]);

  useEffect(() => {
    fetchUtilityCosts();
  }, [selectedProperty, selectedYear]);

  const fetchProperties = async () => {
    try {
      let query = supabase.from('properties').select('id, name');
      
      if (userRole === 'tenant') {
        // For tenants, only show properties they're associated with
        query = query.filter('id', 'in', (supabase
          .from('tenancies')
          .select('property_id')
          .eq('tenant_id', userId)
          .eq('status', 'active')));
      } else if (userRole === 'landlord') {
        // For landlords, only show their properties
        query = query.eq('landlord_id', userId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setProperties(data);
        setSelectedProperty(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
    }
  };

  const fetchUtilityCosts = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('utilities')
        .select(`
          id,
          amount,
          type,
          currency,
          due_date,
          property_id,
          properties(name)
        `)
        .eq('status', 'paid');
      
      // Filter by selected property if not 'all'
      if (selectedProperty !== 'all') {
        query = query.eq('property_id', selectedProperty);
      }
      
      // Filter by user role
      if (userRole === 'landlord') {
        // For landlords, filter properties they own
        query = query.filter('property_id', 'in', (supabase
          .from('properties')
          .select('id')
          .eq('landlord_id', userId)));
      } else if (userRole === 'tenant') {
        // For tenants, filter properties they're renting
        query = query.filter('property_id', 'in', (supabase
          .from('tenancies')
          .select('property_id')
          .eq('tenant_id', userId)
          .eq('status', 'active')));
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Process the data to group by property, month, and utility type
      const processedData: UtilityCostData[] = [];
      
      data?.forEach(utility => {
        const dueDate = new Date(utility.due_date);
        const year = dueDate.getFullYear();
        
        // Filter only the selected year
        if (year === selectedYear) {
          const month = dueDate.toLocaleString('default', { month: 'short' });
          
          // Find if we already have this combination
          const existingIndex = processedData.findIndex(
            item => 
              item.property_id === utility.property_id && 
              item.month === month && 
              item.utility_type === utility.type
          );
          
          if (existingIndex >= 0) {
            // Add to existing entry
            processedData[existingIndex].total_cost += utility.amount;
          } else {
            // Create new entry
            processedData.push({
              property_id: utility.property_id,
              property_name: utility.properties?.name || 'Unknown Property',
              month,
              year,
              utility_type: utility.type,
              total_cost: utility.amount
            });
          }
        }
      });
      
      // Sort by month (chronologically)
      const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      processedData.sort((a, b) => {
        const monthCompare = monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
        if (monthCompare !== 0) return monthCompare;
        
        const typeCompare = a.utility_type.localeCompare(b.utility_type);
        if (typeCompare !== 0) return typeCompare;
        
        return a.property_name.localeCompare(b.property_name);
      });
      
      setCostData(processedData);
    } catch (error) {
      console.error("Error fetching utility costs:", error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare data for the chart - group by month and utility type
  const prepareChartData = () => {
    const chartData: any[] = [];
    const months = Array.from(new Set(costData.map(item => item.month)));
    const utilityTypes = Array.from(new Set(costData.map(item => item.utility_type)));
    
    months.forEach(month => {
      const monthData: any = { month };
      
      utilityTypes.forEach(type => {
        // Find all entries for this month and type, across all properties
        const entries = costData.filter(
          item => item.month === month && item.utility_type === type
        );
        
        // Sum up the costs
        const totalCost = entries.reduce((sum, item) => sum + item.total_cost, 0);
        monthData[type] = totalCost;
      });
      
      chartData.push(monthData);
    });
    
    return chartData;
  };

  const chartData = prepareChartData();
  const years = Array.from(
    new Set([...Array(5)].map((_, i) => new Date().getFullYear() - i))
  ).sort((a, b) => b - a);

  const getUtilityTypeColor = (type: string) => {
    switch(type) {
      case 'electricity': return '#8884d8';
      case 'water': return '#82ca9d';
      case 'gas': return '#ffc658';
      case 'internet': return '#ff8042';
      case 'building maintenance': return '#a4de6c';
      default: return '#8884d8';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl font-bold">Utility Cost Analysis</CardTitle>
        <div className="flex space-x-4 mt-2">
          <div className="w-1/2">
            <Select
              value={selectedProperty}
              onValueChange={setSelectedProperty}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select property" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                {properties.map(property => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-1/2">
            <Select
              value={selectedYear.toString()}
              onValueChange={(value) => setSelectedYear(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : costData.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No utility cost data available for the selected filters.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatAmount(Number(value))} />
                  <Legend />
                  {Array.from(new Set(costData.map(item => item.utility_type))).map(type => (
                    <Bar 
                      key={type} 
                      dataKey={type} 
                      name={type.charAt(0).toUpperCase() + type.slice(1)} 
                      fill={getUtilityTypeColor(type)} 
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Utility Type</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costData.map((item, index) => (
                  <TableRow key={`${item.property_id}-${item.month}-${item.utility_type}-${index}`}>
                    <TableCell>{item.property_name}</TableCell>
                    <TableCell>{item.month} {item.year}</TableCell>
                    <TableCell className="capitalize">{item.utility_type}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatAmount(item.total_cost)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
