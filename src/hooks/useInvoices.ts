
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DateRange } from "react-day-picker";
import { Invoice } from "@/types/invoice";

export const useInvoices = () => {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const fetchInvoices = useCallback(async () => {
    try {
      console.log("Fetching invoices...");
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("No user found");
      }

      // Optimize query with inner joins and specific filters
      let query = supabase
        .from("invoices")
        .select(`
          *,
          property:properties!inner(
            name,
            address
          ),
          tenant:profiles!tenant_id_fkey!inner(
            first_name,
            last_name,
            email
          )
        `);
      
      // Apply status filter at the database level
      if (statusFilter !== "all") {
        // Type assertion for status filter
        const typedStatus = statusFilter as "pending" | "paid" | "overdue";
        query = query.eq("status", typedStatus);
      }
      
      // Apply date range filter at the database level if set
      if (dateRange?.from) {
        query = query.gte("due_date", dateRange.from.toISOString().split('T')[0]);
        
        if (dateRange.to) {
          query = query.lte("due_date", dateRange.to.toISOString().split('T')[0]);
        }
      }

      const { data: invoicesData, error: invoicesError } = await query
        .order("due_date", { ascending: false });

      if (invoicesError) throw invoicesError;

      console.log("Fetched invoices:", invoicesData);
      
      // Process data to match the Invoice type
      const processedInvoices = invoicesData.map(invoice => {
        // Extract tenant data from the first tenant entry
        const tenantData = invoice.tenant?.[0] || {
          first_name: '',
          last_name: '',
          email: ''
        };
        
        return {
          ...invoice,
          // Replace the tenant array with a single tenant object
          tenant: {
            first_name: tenantData.first_name,
            last_name: tenantData.last_name,
            email: tenantData.email
          }
        };
      }) as Invoice[];
      
      setInvoices(processedInvoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch invoices",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, statusFilter, dateRange]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return {
    invoices,
    isLoading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    dateRange,
    setDateRange,
    fetchInvoices,
  };
};
